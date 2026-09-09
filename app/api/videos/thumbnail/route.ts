import { canEmbed, videoCatalog } from "../../../video-catalog";
import { blockedVideoIds } from "../../../video-server";
import { edgeCache, readBounded, YOUTUBE_REFRESH_MS } from "../../../youtube-source";
import {currentYouTubeVideo} from "../../../youtube-feed-server";

const missing = (status = 404) => new Response(null, {status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || (!videoCatalog.some(item=>item.id===id)&&!/^youtube-[\w-]{11}$/.test(id))) return missing();
  try {
    if ((await blockedVideoIds()).has(id)) return missing();
    const video = await currentYouTubeVideo(id);
    if (!video || !canEmbed(video)||!video.thumbnail?.originalUrl) return missing();
    // The only upstream URL comes from validated metadata for a curated ID.
    // Never forward user headers, cookies, IP addresses or query strings.
    const key = new Request(`https://stackscroll-cache.invalid/youtube/thumbnail-v1/${video.youtubeId}?checked=${encodeURIComponent(video.rights.checkedAt)}`);
    const cache = edgeCache();
    let cached: Response | undefined;
    try { cached = await cache?.match(key); } catch { /* Fetch without cache. */ }
    let bytes: Uint8Array<ArrayBuffer>;
    let contentType: string;
    if (cached) {
      contentType = cached.headers.get("Content-Type") || "";
      bytes = await readBounded(cached, 1024 * 1024);
    } else {
      const upstream = await fetch(video.thumbnail.originalUrl, {headers:{Accept:"image/jpeg,image/png,image/webp"},redirect:"error",signal:AbortSignal.timeout(6000)});
      contentType = upstream.headers.get("Content-Type")?.split(";")[0] || "";
      if (!upstream.ok || !["image/jpeg","image/png","image/webp"].includes(contentType)) { console.warn("youtube_thumbnail_unavailable",{videoId:video.id,status:upstream.status});await upstream.body?.cancel(); return missing(502); }
      bytes = await readBounded(upstream, 1024 * 1024);
      if (cache) {
        try { await cache.put(key, new Response(bytes, {headers:{"Content-Type":contentType,"Cache-Control":`public, max-age=${YOUTUBE_REFRESH_MS / 1000}`}})); }
        catch { /* Thumbnails still work if edge storage is unavailable. */ }
      }
    }
    if (!bytes.length || !["image/jpeg","image/png","image/webp"].includes(contentType)) return missing(502);
    if ((await blockedVideoIds()).has(video.id)) return missing();
    return new Response(bytes, {headers:{"Content-Type":contentType,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin"}});
  } catch { return missing(503); }
}
