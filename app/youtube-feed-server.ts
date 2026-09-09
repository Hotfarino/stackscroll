import {canEmbed,videoCatalog,type VideoRecord} from "./video-catalog";
import {discoverYouTube} from "./youtube-discovery";
import {loadYouTubeSource,withYouTubeSource} from "./youtube-source";

export async function youtubeInventory(refresh=false) {
 const discovery=await discoverYouTube(refresh);
 if(discovery.status!=="setup-required")return {items:discovery.items.filter(video=>canEmbed(video)),discovery,failed:discovery.status==="live"?0:1};
 const results=await Promise.all(videoCatalog.map(async video=>{const source=await loadYouTubeSource(video,refresh);return source?withYouTubeSource(video,source):null;}));
 return {items:results.filter((video):video is VideoRecord=>!!video&&canEmbed(video)),discovery,failed:results.filter(video=>!video).length};
}
export async function currentYouTubeVideo(id:string) {
 const inventory=await youtubeInventory();
 return inventory.items.find(video=>video.id===id);
}
