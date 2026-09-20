import {database} from "./video-server";
import {collectNews,type NewsSnapshot} from "./news-collector";
export async function readNewsSnapshot():Promise<NewsSnapshot|null>{
 const row=await database().prepare("SELECT payload FROM feed_ingestion WHERE id = ?").bind("news").first<{payload:string|null}>();
 return row?.payload?JSON.parse(row.payload):null;
}
export async function ingestNews(){
 const db=database(),now=Date.now(),token=crypto.randomUUID();
 await db.prepare("INSERT INTO feed_ingestion (id) VALUES (?) ON CONFLICT(id) DO NOTHING").bind("news").run();
 const acquired=await db.prepare("UPDATE feed_ingestion SET lease_until = ?, lease_token = ? WHERE id = ? AND lease_until <= ? AND updated_at <= ?").bind(now+120000,token,"news",now,now-600000).run();
 if(!acquired.meta.changes)return {status:"already-current-or-running"};
 try {
  const snapshot=await collectNews(await readNewsSnapshot());
  const result=await db.prepare("UPDATE feed_ingestion SET payload = ?, updated_at = ?, lease_until = 0, lease_token = NULL WHERE id = ? AND lease_token = ?").bind(JSON.stringify(snapshot),Date.now(),"news",token).run();
  if(!result.meta.changes)throw new Error("Ingestion lease expired");
  return {status:snapshot.status,count:snapshot.items.length,sources:snapshot.sources,checkedAt:snapshot.fetchedAt};
 }catch(error){
  await db.prepare("UPDATE feed_ingestion SET lease_until = 0, lease_token = NULL WHERE id = ? AND lease_token = ?").bind("news",token).run();throw error;
 }
}
