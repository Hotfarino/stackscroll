import {env} from "cloudflare:workers";
import {edgeCache,loadYouTubeSource,readBounded,validThumbnailUrl,withYouTubeSource} from "./youtube-source";
import type {VideoRecord} from "./video-catalog";

// Called only after the route resolves a catalog-approved video ID and moderation.
async function fetchThumbnailVideo(video:VideoRecord):Promise<VideoRecord|null>{
 if(video.rights.status!=="available"||(video.rights.expiresAt&&Date.parse(video.rights.expiresAt)<=Date.now()))return null;
 const key=(env as unknown as {YOUTUBE_API_KEY?:string}).YOUTUBE_API_KEY;
 if(key){
  try{
   const url=new URL("https://www.googleapis.com/youtube/v3/videos");url.searchParams.set("part","snippet,status,contentDetails");url.searchParams.set("id",video.youtubeId);
   const response=await fetch(url.href,{headers:{"X-Goog-Api-Key":key,Accept:"application/json"},redirect:"manual",signal:AbortSignal.timeout(6000)});
   if(response.ok){
    const data=JSON.parse(new TextDecoder().decode(await readBounded(response,65536)));
    const item=data.items?.find((item:{id:string})=>item.id===video.youtubeId);
    // A definitive removal/restriction must not fall through to older metadata.
    if(!item||item.status?.privacyStatus!=="public"||item.status?.embeddable!==true||item.status?.madeForKids!==false||item.contentDetails?.regionRestriction||item.contentDetails?.contentRating?.ytRating==="ytAgeRestricted")return null;
    const image=["high","medium","standard","default"].map(name=>item.snippet?.thumbnails?.[name]).find(image=>image&&validThumbnailUrl(image.url,video.youtubeId));
    if(image)return {...video,thumbnail:{url:`/api/videos/thumbnail?id=${encodeURIComponent(video.id)}`,originalUrl:image.url,width:image.width||480,height:image.height||360},rights:{...video.rights,checkedAt:new Date().toISOString(),recheckAfter:new Date(Date.now()+900000).toISOString()}};
   }else await response.body?.cancel();
  }catch{console.warn("thumbnail_metadata_api_unavailable",{videoId:video.id});}
 }
 const source=await loadYouTubeSource(video);
 return source?withYouTubeSource(video,source):null;
}

const pending=new Map<string,Promise<VideoRecord|null>>();
const memory=new Map<string,{until:number;video:VideoRecord|null}>();
export async function thumbnailVideo(video:VideoRecord):Promise<VideoRecord|null>{
 if(video.rights.status!=="available"||(video.rights.expiresAt&&Date.parse(video.rights.expiresAt)<=Date.now()))return null;
 const entry=memory.get(video.id);if(entry&&entry.until>Date.now())return entry.video;
 if(pending.has(video.id))return pending.get(video.id)!;
 const work=(async()=>{
  const cache=edgeCache(),key=new Request(`https://stackscroll-cache.invalid/thumbnail-metadata-v2/${video.youtubeId}`);
  try{const stored=await cache?.match(key);if(stored){const value=await stored.json() as VideoRecord;
   if(value.youtubeId===video.youtubeId&&value.thumbnail?.originalUrl&&validThumbnailUrl(value.thumbnail.originalUrl,video.youtubeId)&&Date.parse(value.rights.recheckAfter)>Date.now()){
    const result={...value,id:video.id};memory.set(video.id,{until:Date.parse(value.rights.recheckAfter),video:result});return result;
   }
  }}catch{}
  const result=await fetchThumbnailVideo(video);
  const until=result?Math.min(Date.parse(result.rights.recheckAfter),Date.now()+900000):Date.now()+60000;
  if(memory.size>=250)memory.delete(memory.keys().next().value!);
  memory.set(video.id,{until,video:result});
  if(result)try{await cache?.put(key,Response.json(result,{headers:{"Cache-Control":"public, max-age=900"}}));}catch{}
  return result;
 })().finally(()=>pending.delete(video.id));pending.set(video.id,work);return work;
}
