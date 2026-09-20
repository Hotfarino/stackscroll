import type { Card, Topic } from "./content";

export type VideoRecord = {
  id: string;
  youtubeId: string;
  title: string;
  creator: string;
  creatorUrl?: string;
  thumbnail?: {url:string; originalUrl?:string; width:number; height:number};
  topic: Topic;
  level: Card["level"];
  sourceUrl: string;
  contextUrl: string;
  description?: string;
  durationSeconds?: number;
  publishedAt?: string;
  format?: "short" | "video";
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
  makeVideo({"id": "video-dion-osi", "youtubeId": "fEb_qBelUeo", "title": "OSI model explained in plain English! #comptiaa #cybersecurity #tech", "creator": "Dion Training", "topic": "Networking", "level": "Foundation", "sourceUrl": "https://www.youtube.com/watch?v=fEb_qBelUeo", "contextUrl": "https://www.youtube.com/@DionTraining", "description": "A quick introduction to the layered model used to understand network communication.", "durationSeconds": 44, "publishedAt": "2025-04-04T03:00:54-07:00", "format": "short"}),
  makeVideo({"id": "video-dion-switch", "youtubeId": "XlHUZ2_LzEo", "title": "Router vs. Switch, what's the difference? #tech #cybersecuritycompany #examprep", "creator": "Dion Training", "topic": "Networking", "level": "Foundation", "sourceUrl": "https://www.youtube.com/watch?v=XlHUZ2_LzEo", "contextUrl": "https://www.youtube.com/@DionTraining", "description": "Compare two common network devices and the different jobs they perform.", "durationSeconds": 35, "publishedAt": "2025-05-26T09:00:51-07:00", "format": "short"}),
  makeVideo({"id": "video-chuck-vm", "youtubeId": "g-Ss2AEEP58", "title": "Virtual Machines EXPLAINED (This Is the Magic)", "creator": "NetworkChuck", "topic": "Cloud", "level": "Foundation", "sourceUrl": "https://www.youtube.com/watch?v=g-Ss2AEEP58", "contextUrl": "https://www.youtube.com/@NetworkChuck", "description": "An introduction to virtual machines as a foundation for labs and cloud computing.", "durationSeconds": 78, "publishedAt": "2026-01-22T10:53:34-08:00", "format": "short"}),
  makeVideo({"id": "video-fireship-docker", "youtubeId": "Gjnup-PuquQ", "title": "Docker in 100 Seconds", "creator": "Fireship", "topic": "Development", "level": "Foundation", "sourceUrl": "https://www.youtube.com/watch?v=Gjnup-PuquQ", "contextUrl": "https://docs.docker.com/", "description": "Meet Dockerfiles, images, and containers in a compact developer introduction.", "durationSeconds": 127, "publishedAt": "2020-08-17T10:02:47-07:00", "format": "video"}),
  makeVideo({"id": "video-bombal-ccna", "youtubeId": "h6qibCd6YQQ", "title": "How Long Should You Study for CCNA?", "creator": "David Bombal", "topic": "CCNA", "level": "Foundation", "sourceUrl": "https://www.youtube.com/watch?v=h6qibCd6YQQ", "contextUrl": "https://www.youtube.com/@davidbombal", "description": "Consider how practice exams and hands-on labs can help assess CCNA readiness. Study-time advice is personal guidance, not a guaranteed timeline.", "durationSeconds": 111, "publishedAt": "2026-09-07T13:00:05-07:00", "format": "short"}),
  makeVideo({"id": "video-geerling-pi", "youtubeId": "WYWKFeXrYe4", "title": "The Raspberry Pi 5 in 60 seconds #shorts", "creator": "Jeff Geerling", "topic": "CompTIA", "level": "Foundation", "sourceUrl": "https://www.youtube.com/watch?v=WYWKFeXrYe4", "contextUrl": "https://www.raspberrypi.com/products/raspberry-pi-5/", "description": "A hardware overview of the Raspberry Pi 5 for small computing projects. This is the original 2023 overview, not a new product announcement.", "durationSeconds": 57, "publishedAt": "2023-09-27T22:38:57-07:00", "format": "short"}),
  makeVideo({"id": "video-dion-netplus", "youtubeId": "43Ypc-sFjDg", "title": "Tips for the CompTIA Network+ exam! #tech #cybersecuritycompany #cybersecurity", "creator": "Dion Training", "topic": "CompTIA", "level": "Foundation", "sourceUrl": "https://www.youtube.com/watch?v=43Ypc-sFjDg", "contextUrl": "https://www.youtube.com/@DionTraining", "description": "Study tips for learners preparing for Network+. Check the current exam objectives alongside older study content.", "durationSeconds": 43, "publishedAt": "2025-04-08T03:00:06-07:00", "format": "short"}),
  makeVideo({"id": "video-fireship-k8s", "youtubeId": "PziYflu8cB8", "title": "Kubernetes Explained in 100 Seconds", "creator": "Fireship", "topic": "Cloud", "level": "Intermediate", "sourceUrl": "https://www.youtube.com/watch?v=PziYflu8cB8", "contextUrl": "https://kubernetes.io/", "description": "An introduction to how Kubernetes coordinates containers and scales workloads. Use current documentation for commands and deployment details.", "durationSeconds": 126, "publishedAt": "2020-09-24T12:54:38-07:00", "format": "video"}),
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
  return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;
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
  return { id: video.id, kind: "video", title: video.title, topic: video.topic, level: video.level, source: video.sourceUrl, sourceName: video.creator, date: video.publishedAt };
}

export function resolveSavedVideos(saved: Card[], available: VideoRecord[]): Card[] {
  return saved.flatMap(card => {
    if (card.kind !== "video") return [card];
    const current = available.find(video => video.id === card.id);
    return current ? [videoAsCard(current)] : [];
  });
}
