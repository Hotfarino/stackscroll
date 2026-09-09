import { canEmbed, videoCatalog } from "../../video-catalog";
import { blockedVideoIds, json } from "../../video-server";
import { loadYouTubeSource, withYouTubeSource } from "../../youtube-source";

export async function GET() {
  try {
    const blocked = await blockedVideoIds();
    const curated = videoCatalog.filter(video => !blocked.has(video.id));
    const results = await Promise.all(curated.map(async video => {
      const source = await loadYouTubeSource(video);
      if (!source) return null;
      const current = withYouTubeSource(video, source);
      return canEmbed(current) ? current : null;
    }));
    // A takedown may arrive during the upstream lookup. Recheck before delivery.
    const currentBlocks = await blockedVideoIds();
    const items = results.filter(video => video !== null && !currentBlocks.has(video.id));
    return json({items, source:"youtube-oembed", refreshHours:6});
  } catch {
    // Do not bypass a takedown when moderation storage is unavailable.
    return json({error:"Videos are temporarily unavailable. Lessons and quizzes are still available."},503);
  }
}

export function POST() { return json({error:"Video uploads are not available. Stackscroll currently curates official embeds."},405); }
