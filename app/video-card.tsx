"use client";
import { useEffect, useRef, useState } from "react";
import { Bookmark, ExternalLink, Flag, Play, Shield, Video, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StackButton } from "./brand";
import { embedUrl, videoIdentity, type createPlaybackSession, type VideoRecord } from "./video-catalog";

function YouTubeThumbnail({video,blocked}:{video:VideoRecord;blocked:boolean}) {
  const [failed,setFailed] = useState(false);
  useEffect(()=>setFailed(false),[video.id,video.rights.checkedAt]);
  const safe = video.thumbnail?.url === `/api/videos/thumbnail?id=${encodeURIComponent(video.id)}`;
  return <figure className="youtube-preview">
    {!blocked&&!failed&&safe&&video.thumbnail ? <img key={video.rights.checkedAt} src={video.thumbnail.url} width={video.thumbnail.width} height={video.thumbnail.height} alt={`YouTube thumbnail: ${video.title}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/> : <div className="youtube-preview-fallback"><Video size={30}/><span>{blocked?"YouTube preview blocked":"YouTube preview unavailable"}</span></div>}
    <figcaption><span>YouTube</span><a href={video.creatorUrl||video.sourceUrl} target="_blank" rel="noopener noreferrer">{video.creator} <ExternalLink size={13}/></a></figcaption>
  </figure>;
}

export function ReportVideo({video}: {video?:VideoRecord}) {
  const [open,setOpen] = useState(false);
  const [category,setCategory] = useState(video?"accuracy":"privacy");
  const [details,setDetails] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [receipt,setReceipt] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/reports", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({videoId:video?.id||"privacy-request",category,details})});
      const result = await response.json() as {id?:string;error?:string};
      if (!response.ok || !result.id) throw new Error(result.error || "Your report was not saved. Please try again.");
      setReceipt(result.id); setDetails("");
    } catch (error) { setError(error instanceof Error ? error.message : "Your report was not saved. Please try again."); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={value=>{setOpen(value);if(!value)setReceipt("");}}>
    <DialogTrigger asChild><button className="video-text-button"><Flag size={15}/>{video?"Report video":"Request help with my data"}</button></DialogTrigger>
    <DialogContent className="video-dialog"><DialogHeader><DialogTitle>{video?"Report this video":"Privacy request"}</DialogTitle><DialogDescription>{video?`${video.title} · ${video.creator}`:"Ask about your report data or request its removal. Include an earlier report reference if you have one."}</DialogDescription></DialogHeader>
      {receipt ? <div className="report-receipt" role="status"><strong>Your report is in the review queue.</strong><p>Reference: {receipt}</p><StackButton onClick={()=>setOpen(false)}>Done</StackButton></div> : <form onSubmit={submit} className="report-form">
        {video&&<><label htmlFor={`report-type-${video.id}`}>What needs attention?</label>
        <Select value={category} onValueChange={setCategory}><SelectTrigger id={`report-type-${video.id}`}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="accuracy">Incorrect or outdated information</SelectItem><SelectItem value="copyright">Copyright or permission</SelectItem><SelectItem value="privacy">Privacy or exposed personal information</SelectItem><SelectItem value="playback">Video unavailable or playback issue</SelectItem></SelectContent></Select></>}
        <label htmlFor={`report-details-${video?.id||"privacy"}`}>Details</label><Textarea id={`report-details-${video?.id||"privacy"}`} value={details} onChange={event=>setDetails(event.target.value)} minLength={15} maxLength={1500} required placeholder={video?"Describe the issue. Include a timestamp or source link if useful.":"Describe your privacy request and include an earlier report reference if relevant."}/>
        <p className="privacy-small">Your report and account identifier are saved for moderation. Please omit passwords and unrelated personal information. This form is a general report, not a formal DMCA notice.</p>
        {error&&<p role="alert" className="form-error">{error}</p>}<StackButton type="submit" disabled={busy||details.trim().length<15}>{busy?"Submitting…":"Submit report"}</StackButton>
      </form>}
    </DialogContent>
  </Dialog>;
}

export function VideoCard({video,saved,blocked,active,session,onActivate,onUnload,onSave}: {
  video:VideoRecord;saved:boolean;blocked:boolean;active:boolean;session:ReturnType<typeof createPlaybackSession>;onActivate:(id:string)=>void;onUnload:()=>void;onSave:()=>void;
}) {
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const request = useRef<AbortController|null>(null);
  useEffect(()=>{request.current?.abort();setLoading(false);return()=>request.current?.abort();},[blocked]);
  const src = embedUrl(video);
  async function loadPlayer() {
    if (blocked || !src) return;
    session.revoke();
    const token = session.capture(video);
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError("");
    try {
      // Recheck moderation immediately before loading; never trust a saved card.
      const response = await fetch("/api/videos", {cache:"no-store",signal:controller.signal});
      const result = await response.json() as {items?:VideoRecord[];error?:string};
      const approved:VideoRecord|undefined = result.items?.find((item:VideoRecord)=>item.id===video.id);
      if (!response.ok || !approved || !embedUrl(approved)) throw new Error("This video is unavailable or awaiting a source review.");
      if (videoIdentity(approved) !== videoIdentity(video)) throw new Error("This video's source has changed. Refresh the feed and review the new source before loading it.");
      if (!controller.signal.aborted && session.permits(token,approved)) onActivate(videoIdentity(approved));
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "The player could not be loaded."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  return <article className={`learning-card kind-video ${video.format==="short"?"creator-short":""}`} data-topic={video.topic}>
    <div className="card-top"><div className="topic-icon"><Video size={20}/></div><div className="card-author"><strong>{video.creator}</strong><span>{video.topic} <b>·</b> {video.level}</span></div><span className="kind-badge"><Play size={13}/>{video.format==="short"?"Clip":"Video"}{video.durationSeconds&&<> · {Math.floor(video.durationSeconds/60)}:{String(video.durationSeconds%60).padStart(2,"0")}</>}</span></div>
    {!(active&&!blocked&&src)&&<YouTubeThumbnail video={video} blocked={blocked}/>}
    <div className="card-main"><h2>{video.title}</h2>{video.description&&<p className="creator-description"><span className="youtube-context-label">Stackscroll context</span>{video.description}</p>}{video.publishedAt&&<p className="creator-date">Published {new Date(video.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}</p>}
      <div className="video-review-status"><span>Official embed</span><span>{video.factualReview.status==="reviewed"?"Factual review recorded":"Factual review pending"}</span></div>
      {active&&!blocked&&src ? <div className="loaded-video">
        <div className={`video-frame ${video.format==="short"?"vertical-video":""}`}><iframe title={`${video.title} — ${video.creator}`} src={src} allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onError={()=>{onUnload();setError("Playback is unavailable here. You can try the original video on YouTube.");}}/></div>
        <div className="video-load-controls"><span>YouTube player loaded</span><button onClick={onUnload}><X size={15}/>Unload player</button></div>
      </div> : <div className="video-placeholder"><Play size={27} strokeWidth={1.5}/><strong>{blocked?"Embedded videos are blocked":!src?"Source review needed":"Watch the original creator’s clip."}</strong><p>{blocked?"You can change this in Privacy or open the original video.":!src?"Playback is paused until this video's permission record is rechecked.":"Loading connects to Google and may share your IP address, device information, and this page’s address. The player stays off until you choose."}</p>
        {!blocked&&src&&<StackButton onClick={()=>void loadPlayer()} disabled={loading}><Play size={16}/>{loading?"Checking availability…":"Load YouTube player"}</StackButton>}
        <p className="video-consent-note">By loading the player, you agree to <a href="/terms">Stackscroll’s video terms</a> and <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube’s terms</a>, and acknowledge our <a href="/privacy">privacy notice</a>.</p>
      </div>}
      {error&&<p role="alert" className="form-error">{error}</p>}
      <p className="video-original"><a href={video.sourceUrl} target="_blank" rel="noopener noreferrer">Open original on YouTube <ExternalLink size={14}/></a><span>Playback availability is controlled by YouTube.</span></p>
      <Accordion type="single" collapsible className="video-provenance"><AccordionItem value="source"><AccordionTrigger>Source & permissions</AccordionTrigger><AccordionContent><dl>
        <div><dt>Original title</dt><dd>{video.title}</dd></div><div><dt>Creator</dt><dd>{video.creator}</dd></div><div><dt>Sharing permission</dt><dd>Official player only. No download, editing, or sale of access.</dd></div><div><dt>Source check</dt><dd>{video.rights.checkedAt.slice(0,10)} · <a href={video.rights.evidenceUrl} target="_blank" rel="noopener noreferrer">Public embed metadata</a></dd></div><div><dt>Next source review</dt><dd>{video.rights.recheckAfter.slice(0,10)}</dd></div><div><dt>Factual review</dt><dd>{video.factualReview.status==="pending"?"Not independently reviewed by Stackscroll. Creator identity does not establish accuracy.":`Recorded ${video.factualReview.reviewedAt?.slice(0,10)}`}</dd></div>
      </dl><a href={video.contextUrl} target="_blank" rel="noopener noreferrer">Creator or topic reference <ExternalLink size={13}/></a><p>Featuring this video does not imply a partnership or endorsement. Watching earns no points or daily-goal credit.</p></AccordionContent></AccordionItem></Accordion>
    </div>
    <footer className="card-footer"><ReportVideo video={video}/><button className={`icon-button save-button ${saved?"is-saved":""}`} aria-label={`${saved?"Unsave":"Save"} ${video.title}`} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved?"currentColor":"none"}/></button></footer>
  </article>;
}
