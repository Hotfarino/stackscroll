import { videoCatalog } from "../../video-catalog";
import { database, json, readBody, reportSchema, writeAccess } from "../../video-server";
import {currentYouTubeVideo} from "../../youtube-feed-server";

export async function POST(request: Request) {
  const denied = writeAccess(request);
  if (denied) return denied;
  let value: unknown;
  try { value = await readBody(request); } catch { return json({error:"The report could not be read. Keep it under 1,500 characters."},400); }
  const parsed = reportSchema.safeParse(value);
  if (!parsed.success) return json({error:"Choose a video, report type, and 15–1,500 characters of detail."},400);
  if (!videoCatalog.some(video=>video.id===parsed.data.videoId) && !(parsed.data.videoId==="privacy-request"&&parsed.data.category==="privacy") && !(/^youtube-[\w-]{11}$/.test(parsed.data.videoId)&&await currentYouTubeVideo(parsed.data.videoId))) return json({error:"Choose an available video."},400);
  const {videoId,category,details} = parsed.data;
  const userId = request.headers.get("oai-authenticated-user-id")!;
  const now = Date.now();
  const id = crypto.randomUUID();
  try {
    // Atomic rate bound, without IP addresses, device fingerprints or view tracking.
    const result = await database().prepare(`INSERT INTO content_reports (id,user_id,video_id,category,details,status,created_at,updated_at)
      SELECT ?,?,?,?,?, 'open',?,? WHERE (SELECT COUNT(*) FROM content_reports WHERE user_id = ? AND created_at > ?) < 10`)
      .bind(id,userId,videoId,category,details,now,now,userId,now-3600000).run();
    if (!result.meta.changes) return json({error:"You have reached the hourly report limit. Please try again later."},429);
    return json({id,status:"open"},201);
  } catch { return json({error:"Your report was not saved. Please keep your text and try again."},503); }
}
