import {database} from "./video-server";
import {isMetricCode,isMetricSurface,type MetricCode,type MetricSurface} from "./metric-codes";

export const METRIC_PREFIX="metric:";
export async function recordMetric(code:MetricCode,surface:MetricSurface){
 if(!isMetricCode(code)||!isMetricSurface(surface))return false;
 try{
  const db=database(),now=Date.now(),hour=Math.floor(now/3600000)*3600000;
  await db.batch([
   db.prepare("DELETE FROM diagnostic_buckets WHERE hour < ?").bind(now-30*86400000),
   db.prepare("INSERT INTO diagnostic_buckets (hour,code,origin,count,last_seen) VALUES (?,?,?,1,?) ON CONFLICT(hour,code,origin) DO UPDATE SET count = MIN(count + 1,10000), last_seen = excluded.last_seen").bind(hour,`${METRIC_PREFIX}${code}`,surface,now),
  ]);
  return true;
 }catch{return false;}
}
