"use client";
import {reportDiagnostic} from "./diagnostics-client";
import {useEffect,useId,useRef,useState} from "react";
import {ArrowRight,BookOpen,Code2,ExternalLink,Headphones,Play,Smile,Sparkles,X} from "lucide-react";
import {SourceThumbnail} from "./source-thumbnail";
import {youtubeLinkId} from "./youtube-link";
import {Bookmark} from "./reference-bookmark";
import {StackButton} from "./brand";
import {embedUrl,type VideoRecord} from "./video-catalog";
import {youtubePlaybackError} from "./video-card";
import type {Card} from "./content";
import {permittedCatalogExcerpt} from "./content-rights";
import "./catalog.css";

const labels={guide:"Field guide",reference:"Under the hood",article:"Engineering article",repository:"Open-source find",podcast:"Listen in",video:"Watch here",humor:"Tech break",practice:"Try it"};
const icons={guide:BookOpen,reference:Code2,article:BookOpen,repository:Code2,podcast:Headphones,video:Play,humor:Smile,practice:Sparkles};

export function CatalogCard({card,saved,onSave,onBuild,blocked=false,active=false,requested=false,onActivate=()=>{},onUnload=()=>{}}:{card:Card;blocked?:boolean;saved:boolean;onSave:()=>void;onBuild:()=>void;active?:boolean;requested?:boolean;onActivate?:(id:string)=>void;onUnload?:()=>void}){
 const [revealed,setRevealed]=useState(false),[player,setPlayer]=useState<VideoRecord|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const article=useRef<HTMLElement|null>(null),frame=useRef<HTMLIFrameElement|null>(null),handled=useRef(false);
 const frameId=`stackscroll-catalog-player-${useId().replaceAll(":","")}`,meta=card.catalog!,Icon=icons[meta.format],humor=card.kind==="humor";
 const media=meta.format==="video"||meta.format==="podcast",featured=meta.format==="article"||media,youtubeId=meta.format==="video"?youtubeLinkId(card.source):null;
 async function loadPlayer(){if(blocked||!youtubeId)return;onUnload();setLoading(true);setError("");try{const response=await fetch(`/api/catalog/video?id=${encodeURIComponent(card.id)}`,{cache:"no-store"});const result=await response.json() as {item?:VideoRecord;identity?:string;error?:string};if(!response.ok||!result.item||!result.identity||!embedUrl(result.item))throw new Error(result.error||"This video is unavailable or cannot be embedded.");setPlayer(result.item);onActivate(result.identity);}catch(reason){setError(reason instanceof Error?reason.message:"The embedded player could not be loaded.");}finally{setLoading(false);}}
 useEffect(()=>{if(!requested)handled.current=false;else if(!handled.current){handled.current=true;void loadPlayer();}},[requested]);
 useEffect(()=>{if(!active||!article.current||typeof IntersectionObserver==="undefined")return;const observer=new IntersectionObserver(entries=>{if(entries.every(entry=>!entry.isIntersecting||entry.intersectionRatio<.15))onUnload();},{threshold:[0,.15]});observer.observe(article.current);return()=>observer.disconnect();},[active,onUnload]);
 useEffect(()=>{if(!active)return;const receive=(event:MessageEvent)=>{if(!["https://www.youtube.com","https://www.youtube-nocookie.com"].includes(event.origin))return;const message=youtubePlaybackError(event.data,frameId);if(message){setError(`${message} You can still watch it on YouTube.`);onUnload();}};window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive);},[active,frameId,onUnload]);
 const src=player&&embedUrl(player);
 useEffect(()=>{if(error)void reportDiagnostic("youtube-player");},[error]);
 function connectPlayer(){frame.current?.contentWindow?.postMessage(JSON.stringify({event:"listening",id:frameId}),"https://www.youtube-nocookie.com");frame.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func:"addEventListener",args:["onError"],id:frameId}),"https://www.youtube-nocookie.com");}
 return <article ref={article} className={`learning-card catalog-card catalog-${meta.format} ${humor?"catalog-humor":""}`} data-topic={card.topic}>
  <div className="card-top"><div className="topic-icon"><Icon size={19}/></div><div className="card-author"><strong>{card.topic}</strong><span>{humor?"Stackscroll original":card.sourceName}</span></div><span className="kind-badge"><Icon size={13}/>{labels[meta.format]}</span></div>
  {!humor&&(youtubeId&&active&&src?<div className="loaded-video catalog-inline-player"><div className="video-frame"><iframe ref={frame} id={frameId} title={`${card.title} — ${card.sourceName}`} src={src} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onLoad={connectPlayer} onError={()=>{setError("Playback is unavailable here. You can still watch it on YouTube.");onUnload();}}/></div><div className="video-load-controls"><span>YouTube player loaded</span><button onClick={onUnload}><X size={15}/>Unload player</button></div></div>:youtubeId?<div className="catalog-video-thumbnail"><SourceThumbnail src={`/api/catalog/thumbnail?id=${encodeURIComponent(card.id)}`} title={card.title} blocked={blocked} onOpen={()=>void loadPlayer()}/>{loading&&<span className="catalog-player-status" role="status">Checking playback…</span>}</div>:null)}
  <div className="card-main">
   {humor?<div className="humor-scene"><div className="humor-terminal-head"><span/><span/><span/><small>life-in-tech.log</small></div><h2 className="humor-setup">{card.title}</h2><div className="humor-punchline">{card.body}<span className="humor-cursor" aria-hidden="true">▋</span></div>{card.code&&<pre>{card.code}</pre>}<span className="humor-signature">stackscroll / tech break</span></div>:<><h2>{card.title}</h2>{card.date&&<p className="catalog-publication">Published {new Date(card.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}</p>}{permittedCatalogExcerpt(card)&&<blockquote className="catalog-excerpt"><span>From the publisher</span><p>“{permittedCatalogExcerpt(card)}”</p></blockquote>}{card.body&&<p className="card-body">{card.body}</p>}<div className="catalog-tags">{meta.tags.slice(0,4).map(tag=><span key={tag}>{tag}</span>)}</div></>}
   {error&&<p className="form-error" role="alert">{error}</p>}
   {!humor&&<a className="catalog-open" href={card.source} target="_blank" rel="noopener noreferrer">{meta.format==="podcast"?"Listen at the publisher":meta.format==="video"?"Watch on YouTube (optional)":meta.format==="repository"?"Explore the repository":"Open the full source"}<ExternalLink size={16}/></a>}
   {meta.prompt&&<details className="catalog-next"><summary><Sparkles size={15}/>{humor?"There’s a real idea underneath":"Make the connection"}</summary><p>{meta.prompt}</p>{humor&&<a href={card.source} target="_blank" rel="noopener noreferrer">Explore the related concept<ExternalLink size={13}/></a>}<StackButton tone="quiet" onClick={onBuild}>Bring this topic into a Stack<ArrowRight size={15}/></StackButton></details>}
  </div>
  <div className="catalog-provenance"><button type="button" onClick={()=>setRevealed(!revealed)} aria-expanded={revealed}>{humor?"Original humor · not an incident report":youtubeId?"YouTube embed · source stays optional":"Source preview · opens externally"}<span>{revealed?"−":"+"}</span></button>{revealed&&<div><p>{humor?"Written for Stackscroll. Scenarios are fictional; the link explores the underlying technical idea.":youtubeId?"The official YouTube player loads only after you choose it. Stackscroll does not download, edit, or rehost the video.":"A discovery link and short publisher preview. The full work stays with its publisher. This listing is not an independent fact-check or a redistribution license."}</p><p>{humor?"Related source checked":"Publisher listing checked"} {new Date(meta.checkedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}.{card.date&&` Published ${new Date(card.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}.`}</p></div>}</div>
  <footer className="card-footer"><span className="catalog-publisher">{humor?"Stackscroll original":card.sourceName}</span><button className={`icon-button save-button ${saved?"is-saved":""}`} aria-label={`${saved?"Unsave":"Save"} ${card.title}`} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved?"currentColor":"none"}/></button></footer>
 </article>;
}
