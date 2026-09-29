import {database,isModerator,json,readBody,writeAccess} from "../../video-server";
import {isDiagnosticCode} from "../../diagnostic-codes";
import {DIAGNOSTIC_RETENTION,recordDiagnostic} from "../../diagnostics-server";
export async function GET(request:Request){
 if(!isModerator(request))return json({error:"Diagnostics are available only to the workspace owner."},403);
 try {
  const db=database(),now=Date.now();
  await db.prepare("DELETE FROM diagnostic_buckets WHERE hour < ?").bind(now-DIAGNOSTIC_RETENTION).run();
  const rows=await db.prepare("SELECT code,origin,SUM(count) AS count,MAX(last_seen) AS lastSeen FROM diagnostic_buckets WHERE hour >= ? AND code NOT LIKE 'metric:%' GROUP BY code,origin ORDER BY lastSeen DESC").bind(now-86400000).all();
  return json({rows:rows.results,checkedAt:now,windowHours:24});
 }catch{return json({error:"Diagnostic storage is unavailable. This view cannot confirm app health."},503);}
}
export async function POST(request:Request){
 const denied=writeAccess(request);if(denied)return denied;
 if(!isModerator(request))return json({error:"Owner access required."},403);
 let value:unknown;
 try{value=await readBody(request,256);}catch{return json({error:"Invalid diagnostic."},400);}
 if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).length!==1||!("code" in value)||!isDiagnosticCode(value.code))return json({error:"Only a known diagnostic code is accepted."},400);
 return await recordDiagnostic(value.code,"browser")?json({ok:true},201):json({error:"Diagnostic storage is unavailable."},503);
}
