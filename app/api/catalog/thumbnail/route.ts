import {thumbnailVideo} from "../../../thumbnail-source";
import {catalogCards} from "../../../content";
import {videoCatalog} from "../../../video-catalog";
import {blockedVideoIds} from "../../../video-server";
import {youtubeLinkId} from "../../../youtube-link";
import {loadYouTubeSource,readBounded,edgeCache} from "../../../youtube-source";

const missing=(status=404)=>new Response(null,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get("id");
 const card=catalogCards.find(card=>card.id===id&&card.kind==="video");
 const youtubeId=card&&youtubeLinkId(card.source);if(!card||!youtubeId)return missing();
 const aliases=[card.id,`youtube-${youtubeId}`,...videoCatalog.filter(v=>v.youtubeId===youtubeId).map(v=>v.id)];
 try{
  const blocks=await blockedVideoIds();if(aliases.some(id=>blocks.has(id)))return missing();
  // Only catalog-approved links become lookup targets; clients cannot supply a URL.
  // This record is used for oEmbed thumbnail metadata only, never playback approval.
  const seed=videoCatalog.find(v=>v.youtubeId===youtubeId);
  const lookup=seed??{...videoCatalog[0],id:card.id,youtubeId,sourceUrl:`https://www.youtube.com/watch?v=${youtubeId}`};
  const approved=await thumbnailVideo(lookup);if(!approved?.thumbnail?.originalUrl)return missing(502);
  if(new URL(request.url).searchParams.get("metadata")==="1"){
   const current=await blockedVideoIds();if(aliases.some(id=>current.has(id)))return missing();
   return Response.json({url:approved.thumbnail.originalUrl},{headers:{"Cache-Control":"no-store"}});
  }
  const cache=edgeCache(),key=new Request(`https://stackscroll-cache.invalid/catalog-thumb/${youtubeId}?checked=${Math.floor(Date.parse(approved.rights.checkedAt)/900000)}`);
  let response:Response|undefined;try{response=await cache?.match(key);}catch{}
  if(!response){
   const upstream=await fetch(approved.thumbnail.originalUrl,{headers:{Accept:"image/jpeg,image/png,image/webp"},redirect:"manual",signal:AbortSignal.timeout(6000)});
   const type=upstream.headers.get("Content-Type")?.split(";")[0]||"";
   if(!upstream.ok||!["image/jpeg","image/png","image/webp"].includes(type)){await upstream.body?.cancel();return missing(502);}
   const bytes=await readBounded(upstream,1024*1024);if(!bytes.length)return missing(502);
   response=new Response(bytes,{headers:{"Content-Type":type,"Cache-Control":"public, max-age=21600"}});
   try{await cache?.put(key,response.clone());}catch{}
  }
  const currentBlocks=await blockedVideoIds();if(aliases.some(id=>currentBlocks.has(id)))return missing();
  return new Response(response.body,{headers:{"Content-Type":response.headers.get("Content-Type")!,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin"}});
 }catch{return missing(503);}
}
