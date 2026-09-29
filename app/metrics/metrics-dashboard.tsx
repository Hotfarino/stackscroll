"use client";
import {useEffect,useMemo,useState} from "react";
import {Activity,AlertTriangle,BookOpenCheck,Layers3,MousePointerClick,RefreshCw,UsersRound} from "lucide-react";
import {metricLabels,type MetricCode} from "../metric-codes";
import {StackButton} from "../brand";

type MetricRow={code:MetricCode;count:number;lastSeen:number};
type DailyRow={day:number;views:number;sessions:number;actions:number};
type ErrorRow={code:string;count:number;lastSeen:number};
type Snapshot={checkedAt:number;retentionDays:number;events:MetricRow[];daily:DailyRow[];errors:ErrorRow[];product:{createdStacks:number;activeStacks:number;examAttempts:number;openReports:number;pendingProjects:number}};
const windows={"24h":86400000,"7d":7*86400000,"30d":30*86400000} as const;
function compact(value:number){return new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1}).format(value);}

export function MetricsDashboard(){
 const [data,setData]=useState<Snapshot|null>(null),[range,setRange]=useState<keyof typeof windows>("7d"),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function refresh(){setBusy(true);setError("");try{const response=await fetch("/api/metrics",{cache:"no-store",signal:AbortSignal.timeout(10000)});const body=await response.json() as Snapshot&{error?:string};if(!response.ok)throw new Error(body.error||"Metrics unavailable.");setData(body);}catch(value){setError(value instanceof Error?value.message:"Metrics unavailable.");}finally{setBusy(false);}}
 useEffect(()=>{void refresh();},[]);
 const rows=useMemo(()=>{if(!data)return[];const cutoff=data.checkedAt-windows[range];return data.daily.filter(row=>row.day>=cutoff);},[data,range]);
 const totals=useMemo(()=>rows.reduce((sum,row)=>({views:sum.views+Number(row.views),sessions:sum.sessions+Number(row.sessions),actions:sum.actions+Number(row.actions)}),{views:0,sessions:0,actions:0}),[rows]);
 const max=Math.max(1,...rows.map(row=>Number(row.views)));
 return <div className="metrics-dashboard">
  <div className="metrics-toolbar"><div><p>Private aggregate telemetry · no third-party tracker</p><small>Counts are events, not verified people. Sessions are per-tab estimates with a 30-minute boundary.</small></div><div className="metrics-range" role="group" aria-label="Metric window">{Object.keys(windows).map(item=><button key={item} aria-pressed={range===item} onClick={()=>setRange(item as keyof typeof windows)}>{item}</button>)}</div><StackButton tone="secondary" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={15}/>{busy?"Refreshing…":"Refresh"}</StackButton></div>
  {error&&<p role="alert" className="metrics-error">{error}</p>}
  {!data&&!error&&<p>Loading development metrics…</p>}
  {data&&<>
   <section className="metric-kpis" aria-label="Usage summary"><article><UsersRound/><span>Sessions</span><strong>{compact(totals.sessions)}</strong><small>Estimated starts</small></article><article><Activity/><span>Feed views</span><strong>{compact(totals.views)}</strong><small>Page loads</small></article><article><MousePointerClick/><span>Actions</span><strong>{compact(totals.actions)}</strong><small>Tracked interactions</small></article><article><AlertTriangle/><span>Errors</span><strong>{compact(data.errors.reduce((sum,row)=>sum+Number(row.count),0))}</strong><small>Previous 7 days</small></article></section>
   <section className="metrics-panel"><div className="metrics-heading"><div><span>TRAFFIC RHYTHM</span><h2>Daily feed activity</h2></div><p>{range} window</p></div>{rows.length?<div className="metrics-chart" aria-label="Daily feed views chart">{rows.map(row=><div key={row.day} className="metrics-bar-column" title={`${new Date(row.day).toLocaleDateString()}: ${row.views} views`}><div className="metrics-bar-value">{row.views||""}</div><div className="metrics-bar" style={{height:`${Math.max(row.views?8:1,Number(row.views)/max*100)}%`}}/><time>{new Date(row.day).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</time></div>)}</div>:<p className="metrics-empty">No feed activity has been recorded in this window yet.</p>}</section>
   <div className="metrics-columns"><section className="metrics-panel"><div className="metrics-heading"><div><span>ENGAGEMENT</span><h2>What testers use</h2></div></div><div className="metric-list">{data.events.filter(row=>!['page-view','session-start'].includes(row.code)).slice(0,10).map(row=><div key={row.code}><span>{metricLabels[row.code]||row.code}</span><strong>{compact(Number(row.count))}</strong></div>)}{data.events.length<=2&&<p className="metrics-empty">Interaction counts will appear as the opening session runs.</p>}</div></section>
   <section className="metrics-panel"><div className="metrics-heading"><div><span>PRODUCT STATE</span><h2>Development workload</h2></div></div><div className="metric-list"><div><span><Layers3/>Created Stacks</span><strong>{data.product.createdStacks}</strong></div><div><span><BookOpenCheck/>Active Stacks</span><strong>{data.product.activeStacks}</strong></div><div><span>Practice attempts</span><strong>{data.product.examAttempts}</strong></div><div><span>Open content reports</span><strong>{data.product.openReports}</strong></div><div><span>Creator projects pending</span><strong>{data.product.pendingProjects}</strong></div></div></section></div>
   <section className="metrics-panel"><div className="metrics-heading"><div><span>RELIABILITY</span><h2>Error signals · previous 7 days</h2></div><a href="/diagnostics">Open diagnostics</a></div>{data.errors.length?<div className="metric-list">{data.errors.map(row=><div key={row.code}><span>{row.code.replaceAll("-"," ")}</span><strong>{row.count}</strong><time>{new Date(row.lastSeen).toLocaleString()}</time></div>)}</div>:<p className="metrics-empty">No aggregate error reports recorded in this window.</p>}</section>
   <p className="metrics-footnote">Updated {new Date(data.checkedAt).toLocaleString()} · Aggregate records expire after {data.retentionDays} days. This dashboard intentionally does not calculate unique visitors or identify individual users.</p>
  </>}
 </div>;
}
