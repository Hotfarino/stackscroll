import { canEmbed, videoCatalog } from "../../video-catalog";
import { blockedVideoIds, json } from "../../video-server";

export async function GET() {
  try {
    const blocked = await blockedVideoIds();
    return json({ items: videoCatalog.filter(video => canEmbed(video) && !blocked.has(video.id)) });
  } catch {
    // Do not bypass a takedown when moderation storage is unavailable.
    return json({error:"Videos are temporarily unavailable. Lessons and quizzes are still available."},503);
  }
}

export function POST() { return json({error:"Video uploads are not available. Stackscroll currently curates official embeds."},405); }
