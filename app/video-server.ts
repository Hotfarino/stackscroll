import { env } from "cloudflare:workers";
import { z } from "zod";

// The current private workspace owner. Never authorize moderation in client code.
// Change this server-only allowlist when transferring editorial ownership.
const moderatorEmails = new Set(["bigdawgroof@gmail.com"]);

export function isModerator(request: Request): boolean {
  return !!request.headers.get("oai-authenticated-user-id")
    && moderatorEmails.has((request.headers.get("oai-authenticated-user-email") || "").toLowerCase());
}

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

export async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > 8192) throw new Error("Request too large");
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
      if (total > 8192) { await reader.cancel(); throw new Error("Request too large"); }
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
