import { z } from "zod";
import { database, json, readBody } from "../../video-server";
import { adultPolicy, stackDefinitionSchema, storedStackDefinitionSchema, createEdition, type PersonalStack, type StackEdition } from "../../personal-stacks";

type Row = { id: string; user_id: string; draft: string; revision: number; active_version: number | null; last_operation_id: string; last_operation_hash: string; created_at: number; updated_at: number; edition: string | null };
const select = "SELECT s.*, v.edition FROM personal_stacks s LEFT JOIN personal_stack_versions v ON v.stack_id = s.id AND v.version = s.active_version AND v.user_id = s.user_id WHERE s.user_id = ?";
function stored(row: Row): PersonalStack {
  const active = row.edition ? JSON.parse(row.edition) as StackEdition : null;
  if (active) active.definition = storedStackDefinitionSchema.parse(active.definition);
  return { id: row.id, draft: storedStackDefinitionSchema.parse(JSON.parse(row.draft)), revision: row.revision, activeVersion: row.active_version, active, createdAt: row.created_at, updatedAt: row.updated_at };
}
const commandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("attest"), adult: z.literal(true), policy: z.literal(adultPolicy) }).strict(),
  z.object({ operation: z.literal("save"), stackId: z.string().uuid(), revision: z.number().int().nonnegative(), operationId: z.string().uuid(), definition: stackDefinitionSchema }).strict(),
  z.object({ operation: z.literal("activate"), stackId: z.string().uuid(), revision: z.number().int().nonnegative(), operationId: z.string().uuid(), definition: stackDefinitionSchema }).strict(),
  z.object({ operation: z.literal("delete"), stackId: z.string().uuid(), revision: z.number().int().positive() }).strict(),
]);
async function digest(value: unknown) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
export async function GET(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id");
  if (!user) return json({ error: "Sign in to load your private Stacks." }, 401);
  try {
    const db = database();
    const [account, rows] = await Promise.all([
      db.prepare("SELECT age_policy, age_method FROM stack_accounts WHERE user_id = ?").bind(user).first<{ age_policy: string; age_method: string }>(),
      db.prepare(select + " ORDER BY s.updated_at DESC").bind(user).all<Row>(),
    ]);
    return json({ eligible: account?.age_policy === adultPolicy && account.age_method === "self_attestation", stacks: rows.results.map(stored) });
  } catch (error) { console.error("Personal Stack read failed", error); return json({ error: "Your Stacks could not be loaded. Try again." }, 503); }
}
export async function POST(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id");
  if (!user) return json({ error: "Sign in to save your Stack." }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "This request must come from Stackscroll." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "JSON is required." }, 415);
  let command: z.infer<typeof commandSchema>;
  try { command = commandSchema.parse(await readBody(request)); } catch { return json({ error: "That Stack update is not valid. Check its topics and content." }, 400); }
  try {
    const db = database(); const now = Date.now();
    if (command.operation === "attest") {
      await db.prepare("INSERT INTO stack_accounts (user_id,age_policy,age_method,attested_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET age_policy=excluded.age_policy,age_method=excluded.age_method,attested_at=excluded.attested_at").bind(user, adultPolicy, "self_attestation", now).run();
      return json({ eligible: true });
    }
    const getCurrent = () => db.prepare(select + " AND s.id = ?").bind(user, command.stackId).first<Row>();
    const current = await getCurrent();
    if (command.operation === "delete") {
      if (!current) return json({ error: "Stack not found." }, 404);
      const result = await db.prepare("DELETE FROM personal_stacks WHERE id = ? AND user_id = ? AND revision = ?").bind(command.stackId, user, command.revision).run();
      if (result.meta.changes !== 1) return json({ error: "This Stack changed elsewhere. Reload it before deleting." }, 409);
      return json({ deletedId: command.stackId });
    }
    const eligible = await db.prepare("SELECT user_id FROM stack_accounts WHERE user_id = ? AND age_policy = ? AND age_method = 'self_attestation'").bind(user, adultPolicy).first();
    if (!eligible) return json({ error: "Confirm you are 18 or older before saving a Stack." }, 403);
    const hash = await digest(command);
    if (current?.last_operation_id === command.operationId) {
      if (current.last_operation_hash !== hash) return json({ error: "This request identifier was already used for a different update." }, 409);
      return json({ stack: stored(current) });
    }
    if (command.revision !== (current?.revision ?? 0)) return json({ error: current ? "This Stack changed in another tab. Your unsaved draft is kept; reload the saved version or save a new copy." : "Stack not found.", ...(current ? { stack: stored(current) } : {}) }, current ? 409 : 404);
    let edition: StackEdition | null = null;
    if (command.operation === "activate") {
      try { edition = createEdition(command.definition); } catch (error) { return json({ error: error instanceof Error ? error.message : "Review this Stack before using it." }, 422); }
    }
    const revision = command.revision + 1;
    const draft = JSON.stringify(command.definition);
    const write = current
      ? db.prepare("UPDATE personal_stacks SET draft = ?, revision = ?, active_version = ?, last_operation_id = ?, last_operation_hash = ?, updated_at = ? WHERE id = ? AND user_id = ? AND revision = ? AND EXISTS (SELECT 1 FROM stack_accounts WHERE user_id = ? AND age_policy = ? AND age_method = 'self_attestation')").bind(draft, revision, edition ? revision : current.active_version, command.operationId, hash, now, command.stackId, user, command.revision, user, adultPolicy)
      : db.prepare("INSERT INTO personal_stacks (id,user_id,draft,revision,active_version,last_operation_id,last_operation_hash,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM personal_stacks WHERE user_id = ?) < 20 AND EXISTS (SELECT 1 FROM stack_accounts WHERE user_id = ? AND age_policy = ? AND age_method = 'self_attestation') ON CONFLICT(id) DO NOTHING").bind(command.stackId, user, draft, revision, edition ? revision : null, command.operationId, hash, now, now, user, user, adultPolicy);
    const statements = [write];
    if (edition) statements.push(db.prepare("INSERT INTO personal_stack_versions (stack_id,version,user_id,edition,created_at) SELECT id,revision,user_id,?,? FROM personal_stacks WHERE id = ? AND user_id = ? AND revision = ? AND last_operation_id = ? AND last_operation_hash = ? ON CONFLICT(stack_id,version) DO NOTHING").bind(JSON.stringify(edition), now, command.stackId, user, revision, command.operationId, hash));
    await db.batch(statements);
    const latest = await getCurrent();
    if (!latest || latest.last_operation_id !== command.operationId || latest.last_operation_hash !== hash) return json({ error: latest ? "This Stack changed elsewhere. Your unsaved draft is kept." : "This Stack could not be saved. You can keep up to 20 private Stacks; reload before trying again.", ...(latest ? { stack: stored(latest) } : {}) }, 409);
    if (edition && (!latest.edition || latest.active_version !== revision)) throw new Error("Stack activation did not produce its edition");
    return json({ stack: stored(latest) });
  } catch (error) { console.error("Personal Stack write failed", error); return json({ error: "This change could not be saved. Your draft is kept; try again." }, 503); }
}
