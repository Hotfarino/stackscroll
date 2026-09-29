import {database,isModerator,json,readBody} from "../../video-server";
import {isMetricCode,isMetricSurface} from "../../metric-codes";
import {recordMetric} from "../../metrics-server";

export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"This request must come from Stackscroll."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return json({error:"JSON is required."},415);
 let value:unknown;try{value=await readBody(request,256);}catch{return json({error:"Invalid metric."},400);}
 if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).length!==2||!("code" in value)||!("surface" in value)||!isMetricCode(value.code)||!isMetricSurface(value.surface))return json({error:"Only known aggregate metrics are accepted."},400);
 return await recordMetric(value.code,value.surface)?json({ok:true},201):json({error:"Metrics storage is unavailable."},503);
}

export async function GET(request:Request){
 if(!isModerator(request))return json({error:"Metrics are available only to the workspace owner."},403);
 try{
  const db=database(),now=Date.now(),since=now-30*86400000;
  await db.prepare("DELETE FROM diagnostic_buckets WHERE hour < ?").bind(since).run();
  const [events,daily,errors,product]=await Promise.all([
   db.prepare("SELECT SUBSTR(code,8) AS code,SUM(count) AS count,MAX(last_seen) AS lastSeen FROM diagnostic_buckets WHERE hour >= ? AND code LIKE 'metric:%' AND origin = 'feed' GROUP BY code ORDER BY count DESC").bind(since).all(),
   db.prepare("SELECT CAST(hour / 86400000 AS INTEGER) * 86400000 AS day,SUM(CASE WHEN code = 'metric:page-view' THEN count ELSE 0 END) AS views,SUM(CASE WHEN code = 'metric:session-start' THEN count ELSE 0 END) AS sessions,SUM(CASE WHEN code NOT IN ('metric:page-view','metric:session-start') THEN count ELSE 0 END) AS actions FROM diagnostic_buckets WHERE hour >= ? AND code LIKE 'metric:%' AND origin = 'feed' GROUP BY day ORDER BY day").bind(since).all(),
   db.prepare("SELECT code,SUM(count) AS count,MAX(last_seen) AS lastSeen FROM diagnostic_buckets WHERE hour >= ? AND code NOT LIKE 'metric:%' GROUP BY code ORDER BY count DESC").bind(now-7*86400000).all(),
   db.batch([
    db.prepare("SELECT COUNT(*) AS count FROM personal_stacks"),
    db.prepare("SELECT COUNT(*) AS count FROM personal_stacks WHERE active_version IS NOT NULL"),
    db.prepare("SELECT COUNT(*) AS count FROM exam_attempts"),
    db.prepare("SELECT COUNT(*) AS count FROM content_reports WHERE status = 'open'"),
    db.prepare("SELECT COUNT(*) AS count FROM social_projects WHERE status = 'pending'"),
   ]),
  ]);
  const productCounts=product.map(result=>Number((result.results?.[0] as {count?:number}|undefined)?.count||0));
  return json({checkedAt:now,retentionDays:30,events:events.results,daily:daily.results,errors:errors.results,product:{createdStacks:productCounts[0],activeStacks:productCounts[1],examAttempts:productCounts[2],openReports:productCounts[3],pendingProjects:productCounts[4]}});
 }catch{return json({error:"Metrics storage is unavailable. No dashboard totals can be confirmed."},503);}
}
