import { z } from "zod";
import { canEmbed, videoCatalog } from "../../video-catalog";
import { blockedVideoIds, database, isModerator, json, readBody, writeAccess } from "../../video-server";
import {youtubeInventory,currentYouTubeVideo} from "../../youtube-feed-server";

export async function GET(request: Request) {
  if (!isModerator(request)) return json({error:"This page is available to the workspace's content moderator."},403);
  try {
    const blocked = await blockedVideoIds();
    const reports = await database().prepare("SELECT id,user_id,video_id,category,details,status,created_at FROM content_reports ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC LIMIT 100").all();
    const inventory=await youtubeInventory();
    const combined=new Map(videoCatalog.map(video=>[video.id,video]));for(const video of inventory.items)combined.set(video.id,video);
    const videos=[...combined.values()].map(video=>({...video,hidden:blocked.has(video.id),eligible:inventory.items.some(item=>item.id===video.id)&&canEmbed(video)}));
    return json({reports:reports.results,videos});
  } catch { return json({error:"The review queue could not be loaded. Please try again."},503); }
}

const actionSchema = z.object({videoId:z.string().max(100),action:z.enum(["hide","restore","resolve","delete"]),reportId:z.string().uuid().optional()}).strict();
export async function POST(request: Request) {
  const denied = writeAccess(request);
  if (denied) return denied;
  if (!isModerator(request)) return json({error:"Moderator access is required."},403);
  let value: unknown;
  try { value = await readBody(request); } catch { return json({error:"Invalid review action."},400); }
  const parsed = actionSchema.safeParse(value);
  if (!parsed.success) return json({error:"Invalid review action."},400);
  const {videoId,action,reportId} = parsed.data;
  const video = videoCatalog.find(item => item.id === videoId)||(/^youtube-[\w-]{11}$/.test(videoId)?await currentYouTubeVideo(videoId):undefined);
  const recorded= !video&&/^youtube-[\w-]{11}$/.test(videoId) ? await database().prepare("SELECT video_id FROM content_reports WHERE video_id=? LIMIT 1").bind(videoId).all() : null;
  if (!video && !recorded?.results.length && !(videoId === "privacy-request" && (action === "resolve" || action === "delete"))) return json({error:"Video not found."},404);
  if ((action === "resolve" || action === "delete") && !reportId) return json({error:"Choose a report."},400);
  if (action === "restore") {
    const current = video ? await currentYouTubeVideo(video.id) : null;
    if (!current || !canEmbed(current)) return json({error:"Recheck the source and permission record before restoring this video."},409);
  }
  try {
    if (action === "hide" || action === "restore") {
      await database().prepare("INSERT INTO video_moderation (video_id,blocked,updated_at) VALUES (?,?,?) ON CONFLICT(video_id) DO UPDATE SET blocked=excluded.blocked,updated_at=excluded.updated_at")
        .bind(videoId,action === "hide" ? 1 : 0,Date.now()).run();
    } else if (action === "resolve") {
      const result = await database().prepare("UPDATE content_reports SET status='resolved',updated_at=? WHERE id=? AND video_id=?").bind(Date.now(),reportId,videoId).run();
      if (!result.meta.changes) return json({error:"The report was not found. Refresh the queue."},404);
    } else {
      const result = await database().prepare("DELETE FROM content_reports WHERE id=? AND video_id=?").bind(reportId,videoId).run();
      if (!result.meta.changes) return json({error:"The report was not found. Refresh the queue."},404);
    }
    return json({ok:true});
  } catch { return json({error:"The change was not saved. Please try again."},503); }
}
