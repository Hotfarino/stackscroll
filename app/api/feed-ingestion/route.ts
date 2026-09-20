import {isModerator,json,writeAccess} from "../../video-server";
import {ingestNews,readNewsSnapshot} from "../../news-ingestion";
export async function GET(request:Request){
 if(!isModerator(request))return json({error:"Moderator access required."},403);
 try{const snapshot=await readNewsSnapshot();return json({checkedAt:snapshot?.fetchedAt??null,status:snapshot?.status??"not-started",count:snapshot?.items.length??0,sources:snapshot?.sources??[]});}catch{return json({error:"Feed storage unavailable."},503);}
}
export async function POST(request:Request){
 const denied=writeAccess(request);if(denied)return denied;
 if(!isModerator(request))return json({error:"Moderator access required."},403);
 try{return json(await ingestNews());}catch{return json({error:"Collection failed; the last saved feed is retained."},503);}
}
