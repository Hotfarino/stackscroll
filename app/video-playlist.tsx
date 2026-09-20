"use client";
import {reportDiagnostic} from "./diagnostics-client";
import {useEffect,useRef,useState} from "react";
import {ListVideo,ArrowUp,ArrowDown,X} from "lucide-react";
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetTrigger} from "@/components/ui/sheet";
import {StackButton} from "./brand";
import {explainers} from "./media-content";
import {canEmbed,videoIdentity,type VideoRecord} from "./video-catalog";

const storageKey="stackscroll-playlist-v1";
export function parsePlaylist(raw:string){const x=JSON.parse(raw);if(!x||typeof x.name!=="string"||x.name.length>80||!Array.isArray(x.ids)||x.ids.length>100||x.ids.some((id:unknown)=>typeof id!=="string"||id.length>100))throw new Error("Invalid playlist");return {name:x.name,ids:[...new Set<string>(x.ids)]};}
export function useVideoPlaylist(){
 const [list,setList]=useState({name:"My tech playlist",ids:[] as string[]}),[ready,setReady]=useState(false),[notice,setNotice]=useState("");const unreadable=useRef(false);
 useEffect(()=>{try{const raw=localStorage.getItem(storageKey);if(raw)setList(parsePlaylist(raw));}catch{unreadable.current=true;setNotice("Saved playlist could not be read. Changes stay in this session until you clear it.");}setReady(true);},[]);
 useEffect(()=>{if(!ready||unreadable.current)return;try{localStorage.setItem(storageKey,JSON.stringify(list));}catch{setNotice("Device storage is unavailable. Playlist changes last for this session.");}},[list,ready]);
 return {list,ready,notice,setList,add:(id:string)=>setList(v=>v.ids.includes(id)||v.ids.length>=100?v:{...v,ids:[...v.ids,id]}),clear:()=>{try{localStorage.removeItem(storageKey);unreadable.current=false;setNotice("");}catch{setNotice("Could not remove the saved playlist from this device.");}setList({name:"My tech playlist",ids:[]});}};
}
type Player={destroy:()=>void;playVideo:()=>void};
type YTApi={Player:new(el:HTMLElement,config:Record<string,unknown>)=>Player};
declare global{interface Window{YT?:YTApi;onYouTubeIframeAPIReady?:()=>void}}
let apiPromise:Promise<YTApi>|null=null;
function loadAPI(){if(window.YT?.Player)return Promise.resolve(window.YT);if(apiPromise)return apiPromise;apiPromise=new Promise<YTApi>((resolve,reject)=>{const script=document.createElement("script");const timeout=setTimeout(()=>{apiPromise=null;script.remove();reject(new Error("YouTube did not load. Stop and try again."));},15000);window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);if(window.YT)resolve(window.YT);};script.src="https://www.youtube.com/iframe_api";script.onerror=()=>{clearTimeout(timeout);apiPromise=null;script.remove();reject(new Error("YouTube could not load."));};document.head.appendChild(script);});return apiPromise;}
function PlaylistPlayer({id,videos,blocked,onEnded}:{id:string;videos:VideoRecord[];blocked:boolean;onEnded:()=>void}){
 useEffect(()=>{const onError=(event:MessageEvent)=>{if(!["https://www.youtube.com","https://www.youtube-nocookie.com"].includes(event.origin)||!host.current?.querySelector("iframe")||event.source!==host.current.querySelector("iframe")?.contentWindow)return;try{const data=typeof event.data==="string"?JSON.parse(event.data):event.data;if(data?.event==="onError")void reportDiagnostic("youtube-player");}catch{}};window.addEventListener("message",onError);return()=>window.removeEventListener("message",onError);},[]);
 const host=useRef<HTMLDivElement>(null),native=useRef<HTMLVideoElement>(null),ended=useRef(onEnded);ended.current=onEnded;
 const [error,setError]=useState("");const clip=explainers.find(v=>v.id===id),record=videos.find(v=>v.id===id);const identity=record?videoIdentity(record):"";const allowed=!!record&&canEmbed(record);
 useEffect(()=>{setError("");let disposed=false,finished=false;let player:Player|undefined;const controller=new AbortController();const video=native.current;
 const finish=()=>{if(!disposed&&!finished){finished=true;ended.current();}};
 if(clip){void video?.play().catch(()=>{if(!disposed)setError("Press Play in the video to continue.");});}
 else if(blocked||!allowed||!record){setError("This video is unavailable or blocked. Use Next or Stop.");}
 else{void(async()=>{try{const response=await fetch("/api/videos",{cache:"no-store",signal:controller.signal});const data=await response.json() as {items?:VideoRecord[]};const fresh=data.items?.find(v=>v.id===id);if(!response.ok||!fresh||!canEmbed(fresh)||videoIdentity(fresh)!==identity)throw new Error("This source is unavailable or changed. Use Next or Stop.");if(disposed)return;const api=await loadAPI();if(disposed||!host.current)return;const mount=document.createElement("div");host.current.replaceChildren(mount);player=new api.Player(mount,{host:"https://www.youtube-nocookie.com",videoId:fresh.youtubeId,playerVars:{autoplay:1,playsinline:1,rel:0,origin:window.location.origin},events:{onStateChange:(e:{data:number})=>{if(e.data===0)finish();},onAutoplayBlocked:()=>{if(!disposed)setError("Your browser paused playback. Press Play in the player to continue.");},onError:()=>{if(!disposed)setError("YouTube cannot play this video here. Use its original link or Next.");}}});}catch(e){if(!disposed)setError(e instanceof Error?e.message:"Playback unavailable.");}})();}
 return()=>{disposed=true;controller.abort();player?.destroy();video?.pause();};
 },[id,identity,allowed,blocked,clip]);
 return <div className="playlist-player">{clip?<video ref={native} controls playsInline poster={clip.poster} src={clip.video} onEnded={()=>ended.current()}><track kind="captions" src={clip.captions} srcLang="en" label="English" default/></video>:<div ref={host}/>}<p role="status">{error}</p>{clip?<details><summary>Transcript & sources</summary>{clip.transcript.map(line=><p key={line}>{line}</p>)}{clip.sources.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></p>)}</details>:record&&<a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">Open original · {record.creator}</a>}</div>;
}
export function VideoPlaylist({model,videos,blocked,onOpen}:{model:ReturnType<typeof useVideoPlaylist>;videos:VideoRecord[];blocked:boolean;onOpen:()=>void}){
 const [open,setOpen]=useState(false),[run,setRun]=useState<string[]>([]),[index,setIndex]=useState(0);const {list,setList}=model;
 const title=(id:string)=>explainers.find(v=>v.id===id)?.title||videos.find(v=>v.id===id)?.title||"Unavailable video";
 const next=()=>setIndex(i=>i+1);const current=run[index];
 function move(i:number,d:number){setList(v=>{const ids=[...v.ids];[ids[i],ids[i+d]]=[ids[i+d],ids[i]];return {...v,ids};});}
 return <Sheet open={open} onOpenChange={v=>{setOpen(v);setRun([]);setIndex(0);if(v)onOpen();}}><SheetTrigger asChild><button className="customize-trigger" aria-label="Open video playlist"><ListVideo size={18}/><span>Playlist ({list.ids.length})</span></button></SheetTrigger><SheetContent className="customizer playlist-panel"><SheetHeader><SheetTitle>Your video playlist</SheetTitle><SheetDescription>Build a sequence of creator clips and original explainers. Saved on this device.</SheetDescription></SheetHeader><div className="customizer-body">
 <label htmlFor="playlist-name">Playlist name</label><input id="playlist-name" value={list.name} maxLength={80} onChange={e=>setList(v=>({...v,name:e.target.value}))}/>
 {model.notice&&<p role="status">{model.notice}</p>}
 {current?<section><h3>{index+1} / {run.length} · {title(current)}</h3><PlaylistPlayer key={current} id={current} videos={videos} blocked={blocked} onEnded={next}/><div className="playlist-actions"><StackButton tone="secondary" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous</StackButton><StackButton tone="secondary" onClick={next}>Next</StackButton><StackButton onClick={()=>setRun([])}>Stop</StackButton></div></section>:<><p>{run.length?"Playlist finished. Choose Play to start again.":"Videos play in your chosen order and stop at the end."}</p><p className="privacy-small">Play starts a continuous session. Creator clips connect to Google; browser rules may require another tap. Closing this panel stops playback. <a href="/privacy">Privacy</a> · <a href="/terms">Video terms</a> · <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube terms</a></p><StackButton disabled={!list.ids.length||!model.ready} onClick={()=>{setIndex(0);setRun([...list.ids]);}}>Play playlist</StackButton></>}
 {blocked&&<p>External videos are blocked. Original explainers still play; skip blocked items with Next.</p>}
 <p className="privacy-small">Creator factual review is pending. Playback does not count as mastery or change your recommendations.</p>
 <ol className="playlist-items">{list.ids.map((id,i)=><li key={id}><span>{i+1}. {title(id)}</span><div><button disabled={i===0||!!current} aria-label={`Move ${title(id)} up`} onClick={()=>move(i,-1)}><ArrowUp size={17}/></button><button disabled={i===list.ids.length-1||!!current} aria-label={`Move ${title(id)} down`} onClick={()=>move(i,1)}><ArrowDown size={17}/></button><button disabled={!!current} aria-label={`Remove ${title(id)}`} onClick={()=>setList(v=>({...v,ids:v.ids.filter(x=>x!==id)}))}><X size={17}/></button></div></li>)}</ol>
 {!list.ids.length&&<p>Add videos from their feed cards to build your playlist.</p>}<StackButton tone="quiet" onClick={()=>{setRun([]);model.clear();}}>Clear playlist</StackButton>
 </div></SheetContent></Sheet>;
}
