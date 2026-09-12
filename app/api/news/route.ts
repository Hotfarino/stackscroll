import { curatedNews, type Card } from "../../content";
import { parseNews, newsSources } from "../../news";
import { discoverHN, discoverPapers } from "../../fresh-discoveries";
let cache: {items:Card[];status:string;sources:{name:string;status:string;count:number}[];fetchedAt:string;expires:number}|undefined;
type NewsSnapshot=NonNullable<typeof cache>;
let inFlight:Promise<void>|undefined;
const sharedKey=new Request("https://stackscroll-cache.invalid/news/last-good-v1");
function sharedCache(){return typeof caches==="undefined"?undefined:(caches as CacheStorage&{default?:Cache}).default;}
export async function GET(request?:Request) {
 if(!cache)try{const stored=await sharedCache()?.match(sharedKey);if(stored){const value=await stored.json() as NewsSnapshot;if(Array.isArray(value.items)&&Number.isFinite(value.expires))cache=value;}}catch{}

 const force=request?new URL(request.url).searchParams.get("refresh")==="1":false;
 if(cache&&cache.expires>Date.now()&&(!force||Date.now()-Date.parse(cache.fetchedAt)<60000))return Response.json(cache,{headers:{"Cache-Control":"private, no-store"}});
 if(!inFlight)inFlight=refreshSources().finally(()=>{inFlight=undefined;});
 await inFlight;
 return Response.json(cache,{headers:{"Cache-Control":"private, no-store"}});
}
async function refreshSources(){
 const providers=[...newsSources.map(source=>source.name),"Hacker News","Hugging Face Papers"];
 const results=await Promise.allSettled([...newsSources.map(async(source)=>{
  const response=await fetch(source.url,{headers:{Accept:"application/rss+xml, application/xml, text/xml"},signal:AbortSignal.timeout(7000),redirect:"manual"});
  if(!response.ok||Number(response.headers.get("content-length")||0)>2000000)throw new Error("Feed unavailable");
  const reader=response.body?.getReader();if(!reader)throw new Error("Empty feed");
  const decoder=new TextDecoder();let xml="",bytes=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2000000){await reader.cancel();throw new Error("Feed too large");}xml+=decoder.decode(value,{stream:true});}xml+=decoder.decode();}finally{reader.releaseLock();}
  const parsed=parseNews(xml,source);if(!parsed.length)throw new Error("No dated headlines");return {items:parsed,partial:false};
 }),discoverHN(),discoverPapers()]);
 const successful=results.filter((r):r is PromiseFulfilledResult<{items:Card[];partial:boolean}>=>r.status==="fulfilled");
 const merged=successful.flatMap(r=>r.value.items).sort((a,b)=>Date.parse(b.date!)-Date.parse(a.date!));
 const recentPrevious=(cache?.items||[]).filter(item=>item.date&&Date.parse(item.date)>Date.now()-7*86400000);
 const unique=[...new Map([...recentPrevious,...merged].map(item=>[item.source,item])).values()].sort((a,b)=>Date.parse(b.date!)-Date.parse(a.date!)).slice(0,200);
 const sources=results.map((r,i)=>({name:providers[i],status:r.status==="rejected"?"unavailable":r.value.partial?"partial":"live",count:r.status==="fulfilled"?r.value.items.length:0}));
 cache={sources,items:unique.length?unique:curatedNews,status:sources.every(s=>s.status==="live")?"live":successful.length?"partial":recentPrevious.length?"stale":"curated",fetchedAt:new Date().toISOString(),expires:Date.now()+(successful.length?600000:60000)};
 if(unique.length)try{await sharedCache()?.put(sharedKey,Response.json(cache,{headers:{"Cache-Control":"public, max-age=86400"}}));}catch{}

}
