import type { Card, Topic } from "./content";

export type VideoRecord = {
  id: string;
  youtubeId: string;
  title: string;
  creator: string;
  topic: Topic;
  level: Card["level"];
  sourceUrl: string;
  contextUrl: string;
  rights: {
    mode: "official-embed";
    status: "available" | "pending" | "revoked";
    evidenceUrl: string;
    checkedAt: string;
    recheckAfter: string;
    expiresAt: string | null;
    canDownload: false;
    canEdit: false;
    canSellAccess: false;
  };
  factualReview: { status: "pending" | "reviewed"; reviewedAt: string | null; evidence: string[] };
};

// Public oEmbed responses supply the official player. These are NOT clip licenses.
// Recheck availability at least every 30 days; a missing/expired record fails closed.
const makeVideo = (data: Omit<VideoRecord, "rights" | "factualReview">): VideoRecord => ({
  ...data,
  rights: {
    mode: "official-embed", status: "available",
    evidenceUrl: `https://www.youtube.com/oembed?url=${encodeURIComponent(data.sourceUrl)}&format=json`,
    checkedAt: "2026-09-08T00:00:00Z", recheckAfter: "2026-10-08T00:00:00Z", expiresAt: null,
    canDownload: false, canEdit: false, canSellAccess: false,
  },
  factualReview: { status: "pending", reviewedAt: null, evidence: [] },
});

export const videoCatalog: VideoRecord[] = [
  makeVideo({ id: "video-aws-cloud", youtubeId: "mxT233EdY5c", title: "What is Cloud Computing? | Amazon Web Services", creator: "Amazon Web Services", topic: "Cloud", level: "Foundation", sourceUrl: "https://www.youtube.com/watch?v=mxT233EdY5c", contextUrl: "https://aws.amazon.com/what-is-cloud-computing/" }),
  makeVideo({ id: "video-google-kubernetes", youtubeId: "cC46cg5FFAM", title: "What is Kubernetes?", creator: "Google Cloud Tech", topic: "Development", level: "Foundation", sourceUrl: "https://www.youtube.com/watch?v=cC46cg5FFAM", contextUrl: "https://cloud.google.com/containers" }),
];

export function canEmbed(video: VideoRecord, now = Date.now()): boolean {
  const r = video.rights;
  return r.mode === "official-embed" && r.status === "available" && /^[\w-]{11}$/.test(video.youtubeId)
    && video.sourceUrl === `https://www.youtube.com/watch?v=${video.youtubeId}`
    && Number.isFinite(Date.parse(r.checkedAt)) && Date.parse(r.checkedAt) <= now
    && Date.parse(r.recheckAfter) > now
    && (r.expiresAt === null || Date.parse(r.expiresAt) > now)
    && !r.canDownload && !r.canEdit && !r.canSellAccess;
}

export function embedUrl(video: VideoRecord, now = Date.now()): string | null {
  if (!canEmbed(video, now)) return null;
  return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=0&playsinline=1&rel=0`;
}

export function videoIdentity(video: VideoRecord): string {
  return `${video.id}:${video.youtubeId}:${video.sourceUrl}`;
}

export function createPlaybackSession() {
  let generation = 0;
  return {
    revoke() { generation += 1; },
    capture(video: VideoRecord) { return {generation,source:videoIdentity(video)}; },
    permits(token: {generation:number;source:string}, video: VideoRecord) {
      return token.generation === generation && token.source === videoIdentity(video);
    },
  };
}

export function videoAsCard(video: VideoRecord): Card {
  return { id: video.id, kind: "video", title: video.title, topic: video.topic, level: video.level, source: video.sourceUrl, sourceName: video.creator };
}

export function resolveSavedVideos(saved: Card[], available: VideoRecord[]): Card[] {
  return saved.flatMap(card => {
    if (card.kind !== "video") return [card];
    const current = available.find(video => video.id === card.id);
    return current ? [videoAsCard(current)] : [];
  });
}
