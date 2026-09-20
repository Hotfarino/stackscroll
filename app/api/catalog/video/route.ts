import {catalogCards} from "../../../content";
import {thumbnailVideo} from "../../../thumbnail-source";
import {videoCatalog,videoIdentity} from "../../../video-catalog";
import {blockedVideoIds,json} from "../../../video-server";
import {youtubeLinkId} from "../../../youtube-link";

export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get("id");
 const card=catalogCards.find(item=>item.id===id&&item.kind==="video");
 const youtubeId=card&&youtubeLinkId(card.source);
 if(!card||!youtubeId)return json({error:"Video not found."},404);
 const aliases=[card.id,`youtube-${youtubeId}`,...videoCatalog.filter(video=>video.youtubeId===youtubeId).map(video=>video.id)];
 try{
  const blocks=await blockedVideoIds();if(aliases.some(alias=>blocks.has(alias)))return json({error:"This video is unavailable."},404);
  const seed=videoCatalog.find(video=>video.youtubeId===youtubeId)??{...videoCatalog[0],id:card.id,youtubeId,sourceUrl:`https://www.youtube.com/watch?v=${youtubeId}`,title:card.title,creator:card.sourceName,creatorUrl:card.source,contextUrl:card.source,topic:card.topic,level:card.level};
  const approved=await thumbnailVideo(seed);if(!approved)return json({error:"This video is unavailable or cannot be embedded."},404);
  const currentBlocks=await blockedVideoIds();if(aliases.some(alias=>currentBlocks.has(alias)))return json({error:"This video is unavailable."},404);
  const item={...approved,id:card.id,title:card.title,creator:card.sourceName,sourceUrl:`https://www.youtube.com/watch?v=${youtubeId}`};
  return json({item,identity:videoIdentity(item)});
 }catch{return json({error:"The embedded player is temporarily unavailable."},503);}
}
