import { z } from "zod";
import { database, json, readBody, writeAccess } from "../../video-server";
import { adultPolicy } from "../../personal-stacks";
import { examBanks } from "../../certification-bank";
import { examTracks, examSetVersion } from "../../certification-catalog";
import { examEditSchema, validateExamEdit, publicAttempt, summarizeAttempt, type ExamData, type ExamRow } from "../../exam-state";

const mutation = { id: z.string().uuid(), operationId: z.string().uuid() };
const commandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("start"), ...mutation, examId: z.string().max(80) }).strict(),
  z.object({ operation: z.literal("save"), ...mutation, revision: z.number().int().positive(), edit: examEditSchema, submit: z.boolean() }).strict(),
  z.object({ operation: z.literal("delete"), id: z.string().uuid(), revision: z.number().int().positive() }).strict(),
]);
async function hash(value: unknown) { const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))); return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join(""); }
export async function GET(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id"); if (!user) return json({ error: "Sign in to open your practice attempts." }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (id && !z.string().uuid().safeParse(id).success) return json({ error: "Invalid attempt." }, 400);
  try {
    const db = database();
    if (id) { const row = await db.prepare("SELECT * FROM exam_attempts WHERE user_id = ? AND id = ?").bind(user, id).first<ExamRow>(); return row ? json({ attempt: publicAttempt(row) }) : json({ error: "Attempt not found." }, 404); }
    const [rows, eligible] = await Promise.all([
      db.prepare("SELECT * FROM exam_attempts WHERE user_id = ? ORDER BY updated_at DESC").bind(user).all<ExamRow>(),
      db.prepare("SELECT user_id FROM stack_accounts WHERE user_id = ? AND age_policy = ? AND age_method = 'self_attestation'").bind(user, adultPolicy).first(),
    ]);
    return json({ attempts: rows.results.map(summarizeAttempt), eligible: !!eligible });
  } catch (error) { console.error("Exam read failed", error); return json({ error: "Your practice could not be loaded. Try again." }, 503); }
}
export async function POST(request: Request) {
  const denied = writeAccess(request); if (denied) return denied;
  const user = request.headers.get("oai-authenticated-user-id")!;
  let command: z.infer<typeof commandSchema>;
  try { command = commandSchema.parse(await readBody(request)); } catch { return json({ error: "This practice update is not valid." }, 400); }
  try {
    const db = database(); const now = Date.now();
    const read = () => db.prepare("SELECT * FROM exam_attempts WHERE user_id = ? AND id = ?").bind(user, command.id).first<ExamRow>();
    const current = await read();
    if (command.operation === "delete") {
      if (!current) return json({ error: "Attempt not found." }, 404);
      const result = await db.prepare("DELETE FROM exam_attempts WHERE user_id = ? AND id = ? AND revision = ?").bind(user, command.id, command.revision).run();
      return result.meta.changes === 1 ? json({ deletedId: command.id }) : json({ error: "This attempt changed elsewhere. Reload before deleting." }, 409);
    }
    const digest = await hash(command);
    if (current?.last_operation_id === command.operationId) return current.last_operation_hash === digest ? json({ attempt: publicAttempt(current) }) : json({ error: "This request identifier was used for another update." }, 409);
    if (command.operation === "start") {
      const track = examTracks.find(item => item.id === command.examId), questions = examBanks[command.examId];
      if (!track || !questions?.length) return json({ error: "That practice set is unavailable." }, 404);
      const eligible = await db.prepare("SELECT user_id FROM stack_accounts WHERE user_id = ? AND age_policy = ? AND age_method = 'self_attestation'").bind(user, adultPolicy).first();
      if (!eligible) return json({ error: "Confirm you are 18 or older before starting practice." }, 403);
      if (current) return json({ error: "That attempt already exists. Resume it or start another." }, 409);
      const data: ExamData = { setVersion: examSetVersion, title: track.name, code: track.code, questions, answers: questions.map(() => []), flagged: [], index: 0 };
      await db.prepare("INSERT INTO exam_attempts (id,user_id,exam_id,data,revision,last_operation_id,last_operation_hash,started_at,updated_at,submitted_at) SELECT ?,?,?,?,1,?,?,?,?,NULL WHERE (SELECT COUNT(*) FROM exam_attempts WHERE user_id = ?) < 50 AND EXISTS (SELECT 1 FROM stack_accounts WHERE user_id = ? AND age_policy = ? AND age_method = 'self_attestation') ON CONFLICT(id) DO NOTHING").bind(command.id, user, command.examId, JSON.stringify(data), command.operationId, digest, now, now, user, user, adultPolicy).run();
    } else {
      if (!current) return json({ error: "Attempt not found." }, 404);
      if (current.revision !== command.revision) return json({ error: "This attempt changed in another tab. The saved answers have been reloaded; review them before continuing.", attempt: publicAttempt(current) }, 409);
      if (current.submitted_at !== null) return json({ error: "A submitted attempt is final. Start a new attempt to practice again." }, 409);
      let data: ExamData;
      try { data = validateExamEdit(JSON.parse(current.data) as ExamData, command.edit); } catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid answer." }, 422); }
      await db.prepare("UPDATE exam_attempts SET data = ?, revision = revision + 1, last_operation_id = ?, last_operation_hash = ?, updated_at = ?, submitted_at = ? WHERE user_id = ? AND id = ? AND revision = ? AND submitted_at IS NULL").bind(JSON.stringify(data), command.operationId, digest, now, command.submit ? now : null, user, command.id, command.revision).run();
    }
    const latest = await read();
    if (!latest || latest.last_operation_id !== command.operationId || latest.last_operation_hash !== digest) return json({ error: latest ? "This attempt changed elsewhere. Saved answers have been reloaded." : "Could not start this attempt. You can retain up to 50; remove an old attempt before retrying.", ...(latest ? { attempt: publicAttempt(latest) } : {}) }, 409);
    return json({ attempt: publicAttempt(latest) });
  } catch (error) { console.error("Exam write failed", error); return json({ error: "This answer could not be saved. Your previous saved answers are kept; retry this change." }, 503); }
}
