"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { PolicyShell } from "../policy-shell";
import { StackButton } from "../brand";
import type { VideoRecord } from "../video-catalog";

type Report = {id:string;user_id:string;video_id:string;category:string;details:string;status:string;created_at:number};
type ManagedVideo = VideoRecord & {hidden:boolean;eligible:boolean};
export function ContentReview() {
  const [data,setData] = useState<{reports:Report[];videos:ManagedVideo[]}|null>(null);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const refresh = useCallback(async()=>{
    setError("");
    try {
      const response = await fetch("/api/moderation",{cache:"no-store"});
      const result = await response.json() as {reports:Report[];videos:ManagedVideo[];error?:string};
      if (!response.ok) {setData(null);throw new Error(result.error || "Unable to load review queue.");}
      setData(result);
    } catch(error) {setError(error instanceof Error?error.message:"Unable to load review queue.");}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  async function act(videoId:string,action:"hide"|"restore"|"resolve"|"delete",reportId?:string) {
    setBusy(true);setError("");
    try {
      const response = await fetch("/api/moderation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({videoId,action,reportId})});
      const result = await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||"The change was not saved.");
      await refresh();
    } catch(error) {setError(error instanceof Error?error.message:"The change was not saved.");}
    finally {setBusy(false);}
  }
  return <PolicyShell title="Content review"><p>Review reports and pause videos while you check the source. This workspace is restricted to the content moderator.</p>{error&&<p role="alert" className="form-error">{error}</p>}<StackButton tone="secondary" disabled={busy} onClick={()=>void refresh()}>Refresh queue</StackButton>
    {!data&&!error&&<p role="status">Loading review queue…</p>}
    {data&&<><section><h2>Video permissions</h2><p>Public embedding is the only enabled sharing method. YouTube titles, creator names, and thumbnails refresh on demand after six hours. Failed source checks and revoked records stop playback; new videos still require editorial selection. Factual review is recorded separately.</p>{data.videos.map(video=><article className="moderation-card" key={video.id}><h3>{video.title}</h3><p>{video.creator} · {video.hidden?"Hidden":video.eligible?"Available":"Source review needed"}</p><dl><div><dt>Method</dt><dd>Official YouTube embed only</dd></div><div><dt>Source checked</dt><dd>{video.rights.checkedAt.slice(0,10)}</dd></div><div><dt>Recheck by</dt><dd>{video.rights.recheckAfter.slice(0,10)}</dd></div><div><dt>Clip license</dt><dd>None. Download, editing, and sale of access are disabled.</dd></div><div><dt>Factual review</dt><dd>{video.factualReview.status}</dd></div></dl><div className="moderation-actions"><a href={video.sourceUrl} target="_blank" rel="noopener noreferrer">Original video</a><a href={video.rights.evidenceUrl} target="_blank" rel="noopener noreferrer">Embed evidence</a><StackButton tone="secondary" disabled={busy||(video.hidden&&!video.eligible)} onClick={()=>void act(video.id,video.hidden?"restore":"hide")}>{video.hidden?"Restore video":"Hide video"}</StackButton></div></article>)}</section>
      <section><h2>Reports</h2><p>Most recent 100 reports, with open reports first. Hiding a video removes it from future playback checks and from open feeds at their next refresh, normally within 30 seconds.</p>{data.reports.length===0?<p className="report-empty">No reports yet.</p>:data.reports.map(report=><article key={report.id} className="moderation-card"><p className="eyebrow">{report.category} / {report.status}</p><h3>{data.videos.find(video=>video.id===report.video_id)?.title||(report.video_id==="privacy-request"?"Privacy request":report.video_id)}</h3><p className="report-details">{report.details}</p><p className="privacy-small">{new Date(report.created_at).toLocaleString()} · {report.id}<br/>Account reference: {report.user_id}</p><div className="moderation-actions">{report.video_id!=="privacy-request"&&<StackButton tone="secondary" disabled={busy} onClick={()=>void act(report.video_id,"hide")}>Hide video</StackButton>}{report.status==="open"&&<StackButton disabled={busy} onClick={()=>void act(report.video_id,"resolve",report.id)}>Mark resolved</StackButton>}
        <AlertDialog><AlertDialogTrigger asChild><StackButton tone="quiet" disabled={busy}>Delete report</StackButton></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this report?</AlertDialogTitle><AlertDialogDescription>This permanently removes the report and its account identifier. The video’s hidden status is kept.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>void act(report.video_id,"delete",report.id)}>Delete report</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div></article>)}</section></>}
  </PolicyShell>;
}
