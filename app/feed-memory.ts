import type {Card} from "./content";

export const FEED_MEMORY_KEY="stackscroll-feed-memory-v1";
const DAY=86400000;
export type FeedMemory={seen:Record<string,number>;dismissed:string[];seed:number};
export const emptyFeedMemory=():FeedMemory=>({seen:{},dismissed:[],seed:0});
export function parseFeedMemory(raw:string|null,now=Date.now()):FeedMemory {
 if(!raw)return emptyFeedMemory();
 if(raw.length>1500000)throw new Error("Feed history too large");
 const value=JSON.parse(raw);
 if(!value||typeof value.seen!=="object"||!value.seen||Array.isArray(value.seen)||!Array.isArray(value.dismissed)||!Number.isSafeInteger(value.seed)||value.seed<0)throw new Error("Invalid feed history");
 const validId=(id:unknown):id is string=>typeof id==="string"&&id.length>0&&id.length<=2000&&!['__proto__','constructor','prototype'].includes(id);
 const seen=Object.fromEntries(Object.entries(value.seen).filter(([id,time])=>validId(id)&&typeof time==="number"&&Number.isFinite(time)&&time<=now&&time>now-90*DAY).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,5000)) as Record<string,number>;
 if(value.dismissed.length>5000||!value.dismissed.every(validId))throw new Error("Invalid hidden cards");
 return {seen,dismissed:[...new Set<string>(value.dismissed)],seed:value.seed};
}
export function feedCandidates(cards:Card[],memory:FeedMemory,now=Date.now(),revisit=false):Card[] {
 const hidden=new Set(memory.dismissed);
 return cards.filter(card=>{
  if(hidden.has(card.id))return false;
  if(card.kind==="news"&&(!card.date||Date.parse(card.date)<now-7*DAY))return false;
  const seen=memory.seen[card.id];if(!seen||revisit)return true;
  const cooldown=["lesson","quiz","flashcard","explainer"].includes(card.kind)?7*DAY:3*DAY;
  return now-seen>=cooldown;
 });
}
// Rotate equal-priority cards reproducibly, without changing IDs or source dates.
export function rotatedCandidates(cards:Card[],seed:number):Card[] {
 function hash(id:string){let h=2166136261;for(const c of `${seed}:${id}`){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return h>>>0;}
 return cards.map(card=>({card,rank:hash(card.id)})).sort((a,b)=>a.rank-b.rank).map(item=>item.card);
}
export function stableFeed(ids:string[],inventory:Card[]):Card[]{
 const available=new Map(inventory.map(card=>[card.id,card]));
 return ids.flatMap(id=>available.has(id)?[available.get(id)!]:[]);
}
