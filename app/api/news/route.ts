import {json} from "../../video-server";
import {ingestNews,readNewsSnapshot} from "../../news-ingestion";
import {newsSources} from "../../news";
export async function GET(request?:Request){
 try {
  let snapshot=await readNewsSnapshot();
  const force=request?new URL(request.url).searchParams.get("refresh")==="1":false;
  if(!snapshot||Date.now()>=snapshot.expires||snapshot.sources.length!==newsSources.length+2||force){
   await ingestNews();snapshot=await readNewsSnapshot();
  }
  if(!snapshot)return json({error:"The first feed collection is still running. Try again shortly."},503);
  return json({...snapshot,status:Date.now()-Date.parse(snapshot.fetchedAt)>7200000?"stale":snapshot.status});
 }catch{return json({error:"Feed storage is temporarily unavailable. Your current cards are kept."},503);}
}
