import { blockedVideoIds, json } from "../../video-server";
import {youtubeInventory} from "../../youtube-feed-server";
import {recordDiagnostic} from "../../diagnostics-server";

export async function GET(request?: Request) {
  try {
    const blocked = await blockedVideoIds();
    const inventory = await youtubeInventory(request ? new URL(request.url).searchParams.get("refresh")==="1" : false);
    // A takedown may arrive during the upstream lookup. Recheck before delivery.
    const currentBlocks = await blockedVideoIds();
    const items = inventory.items.filter(video => !blocked.has(video.id)&&!currentBlocks.has(video.id));
    if(inventory.failed||inventory.discovery.status!=="live")await recordDiagnostic("video-source");
    return json({items,source:inventory.discovery.status==="setup-required"?"youtube-oembed":"youtube-data-api",status:inventory.failed?"partial":"ready",discovery:{status:inventory.discovery.status,message:inventory.discovery.message,checkedAt:inventory.discovery.checkedAt},failedSources:inventory.failed},inventory.failed&&!items.length?503:200);
  } catch {
    await recordDiagnostic("video-request");
    // Do not bypass a takedown when moderation storage is unavailable.
    return json({error:"Videos are temporarily unavailable. Lessons and quizzes are still available."},503);
  }
}

export function POST() { return json({error:"Video uploads are not available. Stackscroll currently curates official embeds."},405); }
