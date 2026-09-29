import { env } from "cloudflare:workers";
import { z } from "zod";

function moderatorIds() {
  const value=(env as unknown as {STACKSCROLL_OWNER_IDS?:string}).STACKSCROLL_OWNER_IDS||"";
  return new Set(value.split(",").map(id=>id.trim()).filter(Boolean));
}

function moderatorEmails() {
  const value=(env as unknown as {STACKSCROLL_OWNER_EMAILS?:string}).STACKSCROLL_OWNER_EMAILS||"";
  return new Set(value.split(",").map(email=>email.trim().toLowerCase()).filter(Boolean));
}

export function isModerator(request: Request): boolean {
  const id=request.headers.get("oai-authenticated-user-id");
  const email=request.headers.get("oai-authenticated-user-email");
  return isModeratorIdentity(id,email);
}

export function isModeratorId(id:string|null):boolean{return !!id&&moderatorIds().has(id);}
export function isModeratorIdentity(id:string|null,email:string|null):boolean{return isModeratorId(id)||!!email&&moderatorEmails().has(email.trim().toLowerCase());}

export function database() {
  if (!env.DB) throw new Error("Report storage unavailable");
  return env.DB;
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export function writeAccess(request: Request): Response | null {
  if (!request.headers.get("oai-authenticated-user-id")) return json({error:"Sign in to submit a report."},401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({error:"This request must come from Stackscroll."},403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({error:"JSON is required."},415);
  return null;
}

export async function readBody(request: Request, limit = 8192): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit) throw new Error("Request too large");
  // Enforce the bound even for chunked requests or missing Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request");
  let total = 0;
  let text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > limit) { await reader.cancel(); throw new Error("Request too large"); }
      text += decoder.decode(result.value, {stream:true});
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}

export const reportSchema = z.object({
  videoId: z.string().max(100),
  category: z.enum(["copyright","privacy","accuracy","playback"]),
  details: z.string().trim().min(15).max(1500),
}).strict();

export async function blockedVideoIds(): Promise<Set<string>> {
  const rows = await database().prepare("SELECT video_id FROM video_moderation WHERE blocked = 1").all<{video_id:string}>();
  return new Set(rows.results.map(row => row.video_id));
}
