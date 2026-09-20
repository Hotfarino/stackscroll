"use client";
import { useEffect, useId, useRef, useState } from "react";
import {ExternalLink, Flag, Play, Shield, Video, X} from "lucide-react";
import {Bookmark} from "./reference-bookmark";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StackButton } from "./brand";
import { embedUrl, videoIdentity, type createPlaybackSession, type VideoRecord } from "./video-catalog";

function YouTubeThumbnail({video,blocked,onPlay,loading}:{video:VideoRecord;blocked:boolean;onPlay:()=>void;loading:boolean}) {
  const [failed,setFailed] = useState(false);
  const [direct,setDirect] = useState(false);
  useEffect(()=>{setFailed(false);setDirect(false);},[video.id,video.rights.checkedAt,blocked]);
  const safe = video.thumbnail?.url === `/api/videos/thumbnail?id=${encodeURIComponent(video.id)}`;
  const original=video.thumbnail?.originalUrl;
  const directSafe=!!original&&new RegExp(`^https://i\\.ytimg\\.com/vi(?:_webp)?/${video.youtubeId}/[a-zA-Z0-9_-]+\\.(?:jpg|webp|png)$`).test(original);
  return <figure className="youtube-preview">
    {!blocked&&!failed&&safe&&video.thumbnail ? <button type="button" className="thumbnail-action" aria-label={`Load player for ${video.title}`} disabled={loading} aria-busy={loading} onClick={onPlay}><img key={`${video.rights.checkedAt}-${direct}`} src={direct&&directSafe?original:video.thumbnail.url} width={video.thumbnail.width} height={video.thumbnail.height} alt={`YouTube thumbnail: ${video.title}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/><span className="thumbnail-play" aria-hidden="true"><Play size={26}/></span></button> : <div className="youtube-preview-fallback"><Video size={30}/><span>{blocked?"YouTube preview blocked":"YouTube preview unavailable"}</span>{!blocked&&failed&&<StackButton tone="secondary" onClick={()=>{setDirect(false);setFailed(false);}}>Retry thumbnail</StackButton>}{!blocked&&failed&&!direct&&directSafe&&<><p>The preview service couldn’t load this image. Loading it directly connects your browser to Google.</p><StackButton tone="secondary" onClick={()=>{setDirect(true);setFailed(false);}}>Load image from YouTube</StackButton></>}</div>}
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

export function youtubePlaybackError(data:unknown, expectedId:string):string|null {
  try {
    const message=typeof data==="string"?JSON.parse(data):data;
    if(!message||typeof message!=="object")return null;
    const event=message as {event?:unknown;id?:unknown;info?:unknown};
    if(event.event!=="onError"||event.id!==expectedId)return null;
    return event.info===101||event.info===150
      ?"This video’s creator has disabled embedded playback."
      :"This video is unavailable in the embedded player.";
  } catch { return null; }
}

export function VideoCard({video,saved,blocked,active,requested=false,session,onActivate,onUnload,onSave}: {
  video:VideoRecord;saved:boolean;blocked:boolean;active:boolean;requested?:boolean;session:ReturnType<typeof createPlaybackSession>;onActivate:(id:string)=>void;onUnload:()=>void;onSave:()=>void;
}) {
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const request = useRef<AbortController|null>(null);
  const article = useRef<HTMLElement|null>(null);
  const frame = useRef<HTMLIFrameElement|null>(null);
  const handledRequest = useRef(false);
  const frameId = `stackscroll-player-${useId().replaceAll(":","")}`;
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
  useEffect(()=>{if(!requested)handledRequest.current=false;else if(!handledRequest.current){handledRequest.current=true;void loadPlayer();}},[requested]);
  useEffect(()=>{
    if(!active||!article.current||typeof IntersectionObserver==="undefined")return;
    const observer=new IntersectionObserver(entries=>{if(entries.every(entry=>!entry.isIntersecting||entry.intersectionRatio<0.15))onUnload();},{threshold:[0,.15]});
    observer.observe(article.current);return()=>observer.disconnect();
  },[active,onUnload]);
  useEffect(()=>{
    if(!active)return;
    const receive=(event:MessageEvent)=>{
      if(!["https://www.youtube.com","https://www.youtube-nocookie.com"].includes(event.origin))return;
      const message=youtubePlaybackError(event.data,frameId);if(!message)return;
      setError(`${message} You can still watch it on YouTube.`);onUnload();
    };
    window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive);
  },[active,frameId,onUnload]);
  function connectPlayer(){frame.current?.contentWindow?.postMessage(JSON.stringify({event:"listening",id:frameId}),"https://www.youtube-nocookie.com");frame.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func:"addEventListener",args:["onError"],id:frameId}),"https://www.youtube-nocookie.com");}
  return <article ref={article} className={`learning-card kind-video ${video.format==="short"?"creator-short":""}`} data-topic={video.topic}>
    <div className="card-top"><div className="topic-icon"><Video size={20}/></div><div className="card-author"><strong>{video.creator}</strong><span>{video.topic} <b>·</b> {video.level}</span></div><span className="kind-badge"><Play size={13}/>{video.format==="short"?"Clip":"Video"}{video.durationSeconds&&<> · {Math.floor(video.durationSeconds/60)}:{String(video.durationSeconds%60).padStart(2,"0")}</>}</span></div>
    {!(active&&!blocked&&src)&&<YouTubeThumbnail video={video} blocked={blocked} loading={loading} onPlay={()=>void loadPlayer()}/>}
    <div className="card-main"><h2>{video.title}</h2>{video.description&&<p className="creator-description"><span className="youtube-context-label">Stackscroll context</span>{video.description}</p>}{video.publishedAt&&<p className="creator-date">Published {new Date(video.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}</p>}
      <div className="video-review-status"><span>Official embed</span><span>{video.factualReview.status==="reviewed"?"Factual review recorded":"Factual review pending"}</span></div>
      {active&&!blocked&&src ? <div className="loaded-video">
        <div className={`video-frame ${video.format==="short"?"vertical-video":""}`}><iframe ref={frame} id={frameId} title={`${video.title} — ${video.creator}`} src={src} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onLoad={connectPlayer} onError={()=>{onUnload();setError("Playback is unavailable here. You can still watch it on YouTube.");}}/></div>
        <div className="video-load-controls"><span>YouTube player loaded</span><button onClick={onUnload}><X size={15}/>Unload player</button></div>
      </div> : <div className="video-placeholder"><Play size={27} strokeWidth={1.5}/><strong>{blocked?"Embedded videos are blocked":!src?"Source review needed":"Watch the original creator’s clip."}</strong><p>{blocked?"You can change this in Privacy or open the original video.":!src?"Playback is paused until this video's permission record is rechecked.":"Loading connects to Google and may share your IP address, device information, and this page’s address. The player stays off until you choose."}</p>
        {!blocked&&src&&<StackButton onClick={()=>void loadPlayer()} disabled={loading}><Play size={16}/>{loading?"Checking availability…":"Load YouTube player"}</StackButton>}
        <p className="video-consent-note">By loading the player, you agree to <a href="/terms">Stackscroll’s video terms</a> and <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube’s terms</a>, and acknowledge our <a href="/privacy">privacy notice</a>.</p>
      </div>}
      {error&&<p role="alert" className="form-error">{error}</p>}
      <p className="video-original"><a href={video.sourceUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube <ExternalLink size={14}/></a><span>Optional · Stackscroll never redirects you automatically.</span></p>
      <Accordion type="single" collapsible className="video-provenance"><AccordionItem value="source"><AccordionTrigger>Source & permissions</AccordionTrigger><AccordionContent><dl>
        <div><dt>Original title</dt><dd>{video.title}</dd></div><div><dt>Creator</dt><dd>{video.creator}</dd></div><div><dt>Sharing permission</dt><dd>Official player only. No download, editing, or sale of access.</dd></div><div><dt>Source check</dt><dd>{video.rights.checkedAt.slice(0,10)} · <a href={video.rights.evidenceUrl} target="_blank" rel="noopener noreferrer">YouTube source</a></dd></div><div><dt>Next source review</dt><dd>{video.rights.recheckAfter.slice(0,10)}</dd></div><div><dt>Factual review</dt><dd>{video.factualReview.status==="pending"?"Not independently reviewed by Stackscroll. Creator identity does not establish accuracy.":`Recorded ${video.factualReview.reviewedAt?.slice(0,10)}`}</dd></div>
      </dl><a href={video.contextUrl} target="_blank" rel="noopener noreferrer">Creator or topic reference <ExternalLink size={13}/></a><p>Featuring this video does not imply a partnership or endorsement. Watching earns no points or daily-goal credit.</p></AccordionContent></AccordionItem></Accordion>
    </div>
    <footer className="card-footer"><ReportVideo video={video}/><button className={`icon-button save-button ${saved?"is-saved":""}`} aria-label={`${saved?"Unsave":"Save"} ${video.title}`} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved?"currentColor":"none"}/></button></footer>
  </article>;
}
