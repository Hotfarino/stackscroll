import {database} from "./video-server";
import {isDiagnosticCode,type DiagnosticCode} from "./diagnostic-codes";
export const DIAGNOSTIC_RETENTION=30*86400000;
export async function recordDiagnostic(code:DiagnosticCode,origin:"browser"|"server"="server"){
 if(!isDiagnosticCode(code))return false;
 try {
  const db=database(),now=Date.now(),hour=Math.floor(now/3600000)*3600000;
  await db.batch([
   db.prepare("DELETE FROM diagnostic_buckets WHERE hour < ?").bind(now-DIAGNOSTIC_RETENTION),
   db.prepare("INSERT INTO diagnostic_buckets (hour,code,origin,count,last_seen) VALUES (?,?,?,1,?) ON CONFLICT(hour,code,origin) DO UPDATE SET count = MIN(count + 1,10000), last_seen = excluded.last_seen").bind(hour,code,origin,now),
  ]);
  return true;
 }catch{return false;}
}
