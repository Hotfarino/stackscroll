import {env} from "cloudflare:workers";
import {z} from "zod";
import {videoCatalog,type VideoRecord} from "./video-catalog";
import {edgeCache,readBounded,validThumbnailUrl} from "./youtube-source";

export const discoveryChannels = [
 {handle:"DionTraining",topic:"CompTIA"},
 {handle:"Fireship",topic:"Development"},
 {handle:"statquest",topic:"Machine learning"},
] as const;
const TTL=15*60*1000, MIN_REFRESH=60*1000;
const thumb=z.object({url:z.string(),width:z.number().optional(),height:z.number().optional()});
const videoSchema=z.object({id:z.string().regex(/^[\w-]{11}$/),snippet:z.object({title:z.string().min(1).max(500),channelId:z.string(),channelTitle:z.string().max(200),publishedAt:z.string(),liveBroadcastContent:z.string().optional(),thumbnails:z.record(z.string(),thumb)}),status:z.object({privacyStatus:z.literal("public"),embeddable:z.literal(true),madeForKids:z.literal(false)}),contentDetails:z.object({duration:z.string(),regionRestriction:z.unknown().optional(),contentRating:z.object({ytRating:z.string().optional()}).optional()})});
export type DiscoveryResult={items:VideoRecord[];status:"live"|"partial"|"unavailable"|"setup-required";checkedAt:number|null;message:string};
export function parseDiscoveredVideo(raw:unknown,channels:Map<string,VideoRecord["topic"]>,now:number):VideoRecord|null {
 const parsed=videoSchema.safeParse(raw);if(!parsed.success)return null;
 const {id,snippet,status,contentDetails}=parsed.data;
 const seed=videoCatalog.find(video=>video.youtubeId===id);
 if(!seed&&!channels.has(snippet.channelId))return null;
 if(seed?.rights.status!==undefined&&seed.rights.status!=="available")return null;
 if(contentDetails.regionRestriction||contentDetails.contentRating?.ytRating==="ytAgeRestricted"||snippet.liveBroadcastContent&&snippet.liveBroadcastContent!=="none")return null;
 if(!Number.isFinite(Date.parse(snippet.publishedAt))||Date.parse(snippet.publishedAt)>now)return null;
 const image=["high","medium","standard","default"].map(key=>snippet.thumbnails[key]).find(value=>value&&validThumbnailUrl(value.url,id));if(!image)return null;
 const duration=contentDetails.duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
 const seconds=duration?Number(duration[1]||0)*3600+Number(duration[2]||0)*60+Number(duration[3]||0):undefined;
 const recordId=seed?.id||`youtube-${id}`;
 return {id:recordId,youtubeId:id,title:snippet.title,creator:snippet.channelTitle,creatorUrl:`https://www.youtube.com/channel/${snippet.channelId}`,topic:seed?.topic||channels.get(snippet.channelId)!,level:seed?.level||"Foundation",sourceUrl:`https://www.youtube.com/watch?v=${id}`,contextUrl:seed?.contextUrl||`https://www.youtube.com/channel/${snippet.channelId}`,description:seed?.description,publishedAt:snippet.publishedAt,durationSeconds:seconds,format:seed?.format||"video",thumbnail:{url:`/api/videos/thumbnail?id=${recordId}`,originalUrl:image.url,width:image.width||480,height:image.height||360},rights:{mode:"official-embed",status:"available",evidenceUrl:`https://www.youtube.com/watch?v=${id}`,checkedAt:new Date(now).toISOString(),recheckAfter:new Date(now+TTL).toISOString(),expiresAt:null,canDownload:false,canEdit:false,canSellAccess:false},factualReview:{status:"pending",reviewedAt:null,evidence:[]}};
}

export function createDiscovery({key,fetcher=fetch,clock=Date.now,cache=edgeCache()}:{key:string;fetcher?:typeof fetch;clock?:()=>number;cache?:ReturnType<typeof edgeCache>}) {
 let latest:DiscoveryResult|undefined,pending:Promise<DiscoveryResult>|undefined;
 let retryAt=0;
 async function api(path:string,params:Record<string,string>){
  const url=new URL(`https://www.googleapis.com/youtube/v3/${path}`);for(const [name,value]of Object.entries(params))url.searchParams.set(name,value);
  // Credentials are server-only, in a header rather than URLs or logs.
  const response=await fetcher(url.href,{headers:{Accept:"application/json","X-Goog-Api-Key":key},redirect:"error",signal:AbortSignal.timeout(6000)});
  if(!response.ok){await response.body?.cancel();throw new Error(`YouTube API returned ${response.status}. Check API access and quota.`);}
  return JSON.parse(new TextDecoder().decode(await readBounded(response,1024*1024)));
 }
 return async function load(refresh=false):Promise<DiscoveryResult>{
  if(!key)return {items:[],status:"setup-required",checkedAt:null,message:"New YouTube uploads are not connected yet. The site owner needs to configure YouTube API access."};
  if(pending)return pending;
  const age=refresh||(latest&&latest.status!=="live")?MIN_REFRESH:TTL;
  if(latest?.checkedAt&&clock()-latest.checkedAt<age)return latest;
  if(clock()<retryAt)return {items:[],status:"unavailable",checkedAt:null,message:"YouTube is temporarily unavailable. Retry in a minute."};
  pending=(async()=>{
   const cacheKey=new Request("https://stackscroll-cache.invalid/youtube/discovery-v1");
   try {
    try {const stored=await cache?.match(cacheKey);if(stored){const result=await stored.json() as DiscoveryResult;if(result.checkedAt&&result.checkedAt<=clock()&&clock()-result.checkedAt<age&&Array.isArray(result.items)){latest=result;return result;}}}catch{}
    const channelResults=await Promise.allSettled(discoveryChannels.map(async source=>{
     const result=await api("channels",{part:"contentDetails",forHandle:source.handle});
     const channel=result.items?.[0];const uploads=channel?.contentDetails?.relatedPlaylists?.uploads;
     if(!/^UC[\w-]{22}$/.test(channel?.id||"")||typeof uploads!=="string")throw new Error("Channel unavailable");
     const list=await api("playlistItems",{part:"contentDetails",playlistId:uploads,maxResults:"12"});
     if(!Array.isArray(list.items))throw new Error("Uploads unavailable");
     return {id:channel.id as string,topic:source.topic,ids:list.items.map((item:{contentDetails?:{videoId?:string}})=>item.contentDetails?.videoId).filter((id:unknown):id is string=>typeof id==="string"&&/^[\w-]{11}$/.test(id))};
    }));
    const good=channelResults.flatMap(result=>result.status==="fulfilled"?[result.value]:[]);
    const channels=new Map<string,VideoRecord["topic"]>(good.map(value=>[value.id,value.topic]));
    const ids=[...new Set([...good.flatMap(value=>value.ids),...videoCatalog.map(video=>video.youtubeId)])].slice(0,50);
    const result=await api("videos",{part:"snippet,status,contentDetails",id:ids.join(",")});
    if(!Array.isArray(result.items))throw new Error("YouTube returned invalid video data.");
    const checkedAt=clock();
    const items=result.items.flatMap((item:unknown)=>{const video=parseDiscoveredVideo(item,channels,checkedAt);return video?[video]:[];}).sort((a:VideoRecord,b:VideoRecord)=>Date.parse(b.publishedAt!)-Date.parse(a.publishedAt!));
    latest={items,status:good.length===discoveryChannels.length?"live":good.length?"partial":"unavailable",checkedAt,message:good.length===discoveryChannels.length?"Latest uploads checked across three tech channels.":"Some YouTube channels could not be checked."};
    if(latest.status!=="live")retryAt=clock()+MIN_REFRESH;
    try{await cache?.put(cacheKey,Response.json(latest,{headers:{"Cache-Control":`public, max-age=${(latest.status==="live"?TTL:MIN_REFRESH)/1000}`}}));}catch{}
    return latest;
   }catch(error){retryAt=clock()+MIN_REFRESH;return {items:[],status:"unavailable",checkedAt:null,message:error instanceof Error?error.message:"YouTube could not be reached."};}
   finally{pending=undefined;}
  })();return pending;
 };
}
let configuredKey="",load:ReturnType<typeof createDiscovery>|undefined;
export function discoverYouTube(refresh=false){const key=(env as unknown as {YOUTUBE_API_KEY?:string}).YOUTUBE_API_KEY||"";if(!load||key!==configuredKey){configuredKey=key;load=createDiscovery({key});}return load(refresh);}
