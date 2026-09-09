import { z } from "zod";
import { type VideoRecord } from "./video-catalog";

// This adapter refreshes explicitly curated IDs. It never searches or imports a
// channel automatically, and a successful source lookup is not a factual review.
export const YOUTUBE_REFRESH_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const metadataSchema = z.object({
  type: z.literal("video"), provider_name: z.literal("YouTube"),
  title: z.string().trim().min(1).max(500),
  author_name: z.string().trim().min(1).max(200),
  author_url: z.string().url().max(500),
  thumbnail_url: z.string().url().max(1000),
  thumbnail_width: z.number().int().min(1).max(4096),
  thumbnail_height: z.number().int().min(1).max(4096),
});
type Metadata = z.infer<typeof metadataSchema>;
export type YouTubeSource = { metadata: Metadata; checkedAt: number };
type CacheLike = Pick<Cache, "match" | "put">;

export function youtubeMetadataUrl(video: VideoRecord) {
  return `https://www.youtube.com/oembed?url=${encodeURIComponent(video.sourceUrl)}&format=json`;
}

export function validThumbnailUrl(value: string, youtubeId: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "i.ytimg.com" && !url.port && !url.username && !url.password
      && !url.search && !url.hash && new RegExp(`^/vi(?:_webp)?/${youtubeId}/[a-zA-Z0-9_-]+\\.(?:jpg|webp|png)$`).test(url.pathname);
  } catch { return false; }
}

function parseMetadata(value: unknown, video: VideoRecord): Metadata {
  const data = metadataSchema.parse(value);
  const creator = new URL(data.author_url);
  if (creator.protocol !== "https:" || creator.hostname !== "www.youtube.com" || creator.port || creator.username || creator.password
    || creator.search || creator.hash || !/^\/(?:@[\w.%-]+|channel\/[\w-]+|user\/[\w-]+)\/?$/.test(creator.pathname)
    || !validThumbnailUrl(data.thumbnail_url, video.youtubeId)) throw new Error("Unexpected source metadata");
  return data;
}

export async function readBounded(response: Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty source response");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    if (Number(response.headers.get("content-length")) > limit) { await reader.cancel(); throw new Error("Source response too large"); }
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("Source response too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export function edgeCache(): CacheLike | undefined {
  return typeof caches === "undefined" ? undefined : (caches as CacheStorage & {default?: Cache}).default;
}

export function createYouTubeSourceLoader({fetcher = fetch, now = Date.now, cache}: {
  fetcher?: typeof fetch; now?: () => number; cache?: CacheLike;
} = {}) {
  const memory = new Map<string, {value: YouTubeSource | null; expires: number}>();
  const pending = new Map<string, Promise<YouTubeSource | null>>();
  return async function source(video: VideoRecord, refresh = false): Promise<YouTubeSource | null> {
    if (!/^[\w-]{11}$/.test(video.youtubeId) || video.sourceUrl !== `https://www.youtube.com/watch?v=${video.youtubeId}`
      || video.rights.status !== "available" || video.rights.canDownload || video.rights.canEdit || video.rights.canSellAccess
      || (video.rights.expiresAt !== null && !(Date.parse(video.rights.expiresAt) > now()))) return null;
    const key = youtubeMetadataUrl(video);
    const local = memory.get(key);
    if (local && local.expires > now() && (!refresh || !local.value || now()-local.value.checkedAt<RETRY_MS)) return local.value;
    memory.delete(key);
    if (pending.has(key)) return pending.get(key)!;
    const work = (async () => {
      const cacheKey = new Request(`https://stackscroll-cache.invalid/youtube/source-v1/${video.youtubeId}`);
      try {
        if (cache) {
          try {
            const cached = await cache.match(cacheKey);
            if (cached) {
              const checkedAt = Number(cached.headers.get("X-Source-Checked-At"));
              if (checkedAt > 0 && checkedAt <= now() && checkedAt + (refresh?RETRY_MS:YOUTUBE_REFRESH_MS) > now()) {
                const metadata = parseMetadata(JSON.parse(new TextDecoder().decode(await readBounded(cached, 32768))), video);
                const value = {metadata, checkedAt};
                memory.set(key, {value, expires: checkedAt + YOUTUBE_REFRESH_MS});
                return value;
              }
            }
          } catch { /* Cache problems must not prevent a fresh source check. */ }
        }
        const response = await fetcher(key, {headers:{Accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(6000)});
        if (!response.ok) { console.warn("youtube_oembed_unavailable",{videoId:video.id,status:response.status});await response.body?.cancel(); throw new Error("YouTube source unavailable"); }
        const metadata = parseMetadata(JSON.parse(new TextDecoder().decode(await readBounded(response, 32768))), video);
        const checkedAt = now();
        const value = {metadata, checkedAt};
        memory.set(key, {value, expires: checkedAt + YOUTUBE_REFRESH_MS});
        if (cache) {
          try { await cache.put(cacheKey, Response.json(metadata, {headers:{"Cache-Control":`public, max-age=${YOUTUBE_REFRESH_MS / 1000}`,"X-Source-Checked-At":String(checkedAt)}})); }
          catch { /* A validated in-memory record is sufficient without edge storage. */ }
        }
        return value;
      } catch (error) {
        console.warn("youtube_source_check_failed",{videoId:video.id,kind:error instanceof Error?error.name:"unknown"});
        // Expired data never masquerades as freshly verified. Back off briefly.
        memory.set(key, {value:null, expires:now() + RETRY_MS});
        return null;
      } finally { pending.delete(key); }
    })();
    pending.set(key, work);
    return work;
  };
}

let loader: ReturnType<typeof createYouTubeSourceLoader> | undefined;
export function loadYouTubeSource(video: VideoRecord, refresh = false) {
  loader ??= createYouTubeSourceLoader({cache:edgeCache()});
  return loader(video,refresh);
}

export function withYouTubeSource(video: VideoRecord, source: YouTubeSource): VideoRecord {
  const {metadata, checkedAt} = source;
  return {
    ...video, title:metadata.title, creator:metadata.author_name, creatorUrl:metadata.author_url,
    thumbnail:{url:`/api/videos/thumbnail?id=${encodeURIComponent(video.id)}`,originalUrl:metadata.thumbnail_url,width:metadata.thumbnail_width,height:metadata.thumbnail_height},
    rights:{...video.rights, evidenceUrl:youtubeMetadataUrl(video), checkedAt:new Date(checkedAt).toISOString(), recheckAfter:new Date(checkedAt + YOUTUBE_REFRESH_MS).toISOString()},
    // Rechecking metadata cannot certify any technical claim in the recording.
    factualReview:video.factualReview,
  };
}
