"use client";
import {useEffect,useRef,useState} from "react";
import {ExternalLink,Image as ImageIcon,Play,Plus,Share2,X} from "lucide-react";
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {StackButton} from "./brand";

type Project={id:string;platform:string;postUrl:string;creatorHandle:string;title:string;summary:string;buildIdea:string;tags:string[];status:string;createdAt:number};
type Player={provider:"Instagram"|"TikTok";src:string}|null;
const empty={postUrl:"",creatorHandle:"",title:"",summary:"",buildIdea:"",tags:""};

function socialPlayer(project:Project):Player{
 try{
  const url=new URL(project.postUrl);
  if(project.platform==="TikTok"){
   const id=url.pathname.match(/\/video\/(\d{10,24})(?:\/|$)/)?.[1];
   return id?{provider:"TikTok",src:`https://www.tiktok.com/player/v1/${id}?autoplay=1&controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=1&rel=0`}:null;
  }
  if(project.platform==="Instagram"){
   const match=url.pathname.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)(?:\/|$)/);
   if(!match)return null;
   const kind=match[1]==="reels"?"reel":match[1];
   return {provider:"Instagram",src:`https://www.instagram.com/${kind}/${match[2]}/embed/`};
  }
 }catch{}
 return null;
}

function SocialPlayer({project,active,blocked,onActivate,onUnload}:{project:Project;active:boolean;blocked:boolean;onActivate:()=>void;onUnload:()=>void}){
 const article=useRef<HTMLElement>(null),frame=useRef<HTMLIFrameElement>(null),player=socialPlayer(project);
 const [loaded,setLoaded]=useState(false),[error,setError]=useState("");
 useEffect(()=>{if(!active){setLoaded(false);return;}const timer=window.setTimeout(()=>{if(!loaded){setError(`${player?.provider||project.platform} did not finish loading here.`);onUnload();}},12000);return()=>window.clearTimeout(timer);},[active,loaded,onUnload,player?.provider,project.platform]);
 useEffect(()=>{if(!active||!article.current||typeof IntersectionObserver==="undefined")return;const observer=new IntersectionObserver(entries=>{if(entries.every(entry=>!entry.isIntersecting||entry.intersectionRatio<.15))onUnload();},{threshold:[0,.15]});observer.observe(article.current);return()=>observer.disconnect();},[active,onUnload]);
 useEffect(()=>{if(!active||player?.provider!=="TikTok")return;const receive=(event:MessageEvent)=>{if(event.origin!=="https://www.tiktok.com"||event.source!==frame.current?.contentWindow)return;const value=event.data as {type?:string};if(value?.type==="onPlayerError"){setError("TikTok cannot play this video here.");onUnload();}};window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive);},[active,player?.provider,onUnload]);
 return <article ref={article} className="social-project-card" data-platform={project.platform.toLowerCase()}><div><span><Share2 size={14}/>{project.platform}</span>{project.status!=="approved"&&<small>{project.status==="rejected"?"Not approved":"Pending review"}</small>}</div><h3>{project.title}</h3>{project.summary&&<p>{project.summary}</p>}{project.buildIdea&&<blockquote><strong>Build it:</strong> {project.buildIdea}</blockquote>}{project.tags.length>0&&<div className="catalog-tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div>}
  {active&&player&&!blocked?<div className="social-inline-player" data-provider={player.provider.toLowerCase()}><div className="social-frame" aria-busy={!loaded}><iframe ref={frame} src={player.src} title={`${project.title} — ${player.provider}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin" onLoad={()=>setLoaded(true)} onError={()=>{setError(`${player.provider} cannot play this video here.`);onUnload();}}/></div><div className="video-load-controls"><span>{loaded?`${player.provider} player loaded`:`Loading ${player.provider}…`}</span><button type="button" onClick={onUnload}><X size={15}/>Unload player</button></div></div>:player&&!blocked?<button type="button" className="social-player-trigger" onClick={()=>{setError("");onActivate();}}><span className="social-poster-mark"><ImageIcon size={17}/>{project.platform}</span><span className="social-poster-play"><Play size={22}/></span><strong>{project.title}</strong><small>Play with the official {player.provider} player · loads on demand</small></button>:player&&blocked?<p className="social-player-note">Embedded players are blocked in Privacy. The original link remains available.</p>:project.platform!=="Facebook"&&<p className="social-player-note"><strong>Profile link saved.</strong> Paste a specific public {project.platform==="Instagram"?"post or Reel":"video"} URL to add an in-card player and playable thumbnail state.</p>}
  {error&&<p className="form-error" role="alert">{error} Use the original link if the creator disabled embedding or removed the post.</p>}
  <a href={project.postUrl} target="_blank" rel="noopener noreferrer">View original{project.creatorHandle!=="@creator"?` from ${project.creatorHandle}`:""}<ExternalLink size={14}/></a>
 </article>;
}

export function SocialProjects({activeId,blocked,onActivate,onUnload}:{activeId:string|null;blocked:boolean;onActivate:(id:string)=>void;onUnload:()=>void}){
 const [items,setItems]=useState<Project[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[form,setForm]=useState(empty);
 useEffect(()=>{void fetch("/api/social-projects",{cache:"no-store"}).then(async response=>{const data=await response.json() as {items?:Project[]};setItems(data.items||[]);}).catch(()=>{});},[]);
 async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setMessage("");try{const response=await fetch("/api/social-projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,tags:form.tags.split(",").map(tag=>tag.trim()).filter(Boolean)})});const data=await response.json() as {item?:Project;error?:string};if(!response.ok||!data.item)throw new Error(data.error||"The project could not be saved.");setItems(current=>[data.item!,...current]);setMessage(data.item.status==="approved"?"Added to the feed.":"Submitted for review. It remains visible to you while pending.");setForm(empty);}catch(error){setMessage(error instanceof Error?error.message:"The project could not be saved.");}finally{setBusy(false);}}
 return <section className="social-projects"><div className="social-projects-head"><div><span className="eyebrow">CREATOR PROJECTS</span><h2>Build from what you discover</h2><p>Curated public creator links stay with their creators. Official Instagram and TikTok players load only when you choose.</p></div><Dialog><DialogTrigger asChild><StackButton><Plus size={16}/>Add creator link</StackButton></DialogTrigger><DialogContent className="social-import-dialog"><DialogHeader><DialogTitle>Add a creator project</DialogTitle><DialogDescription>Enter an Instagram, Facebook, or TikTok creator profile, post, Reel, or video address and give it a short title. You can start with www and leave off https://. Everything else is optional. No profile is scraped and no media is downloaded.</DialogDescription></DialogHeader><form onSubmit={submit}><label>Public creator or content address<Input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={500} placeholder="www.tiktok.com/@creator/video/…" value={form.postUrl} onChange={event=>setForm({...form,postUrl:event.target.value})}/><small>Creator profiles are accepted; use a specific post to enable in-card playback</small></label><label>Creator handle <small>Optional</small><Input maxLength={31} placeholder="@creator or creator" value={form.creatorHandle} onChange={event=>setForm({...form,creatorHandle:event.target.value})}/></label><label>Project title<Input required minLength={3} maxLength={120} placeholder="What is this project?" value={form.title} onChange={event=>setForm({...form,title:event.target.value})}/><small>3–120 characters</small></label><label>Why it matters <small>Optional</small><Textarea maxLength={600} placeholder="Add context for other learners" value={form.summary} onChange={event=>setForm({...form,summary:event.target.value})}/></label><label>What someone can build <small>Optional</small><Textarea maxLength={500} placeholder="Suggest a related project or practice lab" value={form.buildIdea} onChange={event=>setForm({...form,buildIdea:event.target.value})}/></label><label>Tags <small>Optional, comma separated</small><Input maxLength={240} placeholder="cybersecurity, homelab, cloud" value={form.tags} onChange={event=>setForm({...form,tags:event.target.value})}/><small>Up to eight tags</small></label><StackButton type="submit" disabled={busy}>{busy?"Saving…":"Submit project"}</StackButton>{message&&<p role="status">{message}</p>}</form></DialogContent></Dialog></div>{items.length>0&&<div className="social-project-grid">{items.slice(0,6).map(project=><SocialPlayer key={project.id} project={project} active={activeId===project.id} blocked={blocked} onActivate={()=>onActivate(project.id)} onUnload={onUnload}/>)}</div>}</section>;
}
