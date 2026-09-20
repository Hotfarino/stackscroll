import {json} from "../../video-server";
import {ingestNews,readNewsSnapshot} from "../../news-ingestion";
export async function GET(request?:Request){
 try {
  let snapshot=await readNewsSnapshot();
  const force=request?new URL(request.url).searchParams.get("refresh")==="1":false;
  if(!snapshot||Date.now()-Date.parse(snapshot.fetchedAt)>3600000||force){
   await ingestNews();snapshot=await readNewsSnapshot();
  }
  if(!snapshot)return json({error:"The first feed collection is still running. Try again shortly."},503);
  return json({...snapshot,status:Date.now()-Date.parse(snapshot.fetchedAt)>7200000?"stale":snapshot.status});
 }catch{return json({error:"Feed storage is temporarily unavailable. Your current cards are kept."},503);}
}
