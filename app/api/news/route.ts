import { curatedNews, type Card } from "../../content";
import { parseNews, newsSources } from "../../news";
let cache: {items:Card[];status:string;fetchedAt:string;expires:number}|undefined;
export async function GET() {
 if(cache&&cache.expires>Date.now())return Response.json(cache,{headers:{"Cache-Control":"private, max-age=300"}});
 const results=await Promise.allSettled(newsSources.map(async(source)=>{
  const response=await fetch(source.url,{headers:{Accept:"application/rss+xml, application/xml, text/xml"},signal:AbortSignal.timeout(7000),redirect:"manual"});
  if(!response.ok||Number(response.headers.get("content-length")||0)>2000000)throw new Error("Feed unavailable");
  const reader=response.body?.getReader();if(!reader)throw new Error("Empty feed");
  const decoder=new TextDecoder();let xml="",bytes=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2000000){await reader.cancel();throw new Error("Feed too large");}xml+=decoder.decode(value,{stream:true});}xml+=decoder.decode();}finally{reader.releaseLock();}
  const parsed=parseNews(xml,source);if(!parsed.length)throw new Error("No dated headlines");return parsed;
 }));
 const successful=results.filter((r):r is PromiseFulfilledResult<Card[]>=>r.status==="fulfilled");
 const merged=successful.flatMap(r=>r.value).sort((a,b)=>Date.parse(b.date!)-Date.parse(a.date!));
 const unique=[...new Map(merged.map(item=>[item.source,item])).values()];
 cache={items:unique.length?unique:curatedNews,status:successful.length===newsSources.length?"live":successful.length?"partial":"curated",fetchedAt:new Date().toISOString(),expires:Date.now()+(successful.length?600000:60000)};
 return Response.json(cache,{headers:{"Cache-Control":"private, max-age=60"}});
}
