"use client";
import {useEffect,useState} from "react";
import {Play,RotateCcw} from "lucide-react";

// Shared by compact and expanded cards. A fresh source check permits a retry.
export function SourceThumbnail({src,title,blocked=false,revision="",onOpen,href}:{onOpen?:()=>void;href?:string;src?:string;title:string;blocked?:boolean;revision?:string}){
 const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[directUrl,setDirectUrl]=useState<string|null>(null),[direct,setDirect]=useState(false);
 useEffect(()=>{setFailed(false);setAttempt(0);setDirectUrl(null);setDirect(false);},[src,revision,blocked]);
 useEffect(()=>{if(!failed||blocked||attempt!==0)return;const timer=setTimeout(()=>{setAttempt(1);setFailed(false);},65000);return()=>clearTimeout(timer);},[failed,blocked,attempt]);
 useEffect(()=>{
  if(!failed||blocked||!src||direct)return;
  const controller=new AbortController();
  void fetch(`${src}&metadata=1`,{cache:"no-store",signal:controller.signal}).then(async response=>{
   if(!response.ok)return;const data=await response.json() as {url?:unknown};
   if(typeof data.url==="string"&&/^https:\/\/i\.ytimg\.com\/vi(?:_webp)?\/[\w-]{11}\/[\w-]+\.(jpg|png|webp)$/.test(data.url))setDirectUrl(data.url);
  }).catch(()=>{});return()=>controller.abort();
 },[failed,blocked,src,direct]);
 if(blocked)return <span className="source-thumbnail-state"><Play size={24}/>Preview blocked</span>;
 if(!src||failed)return <span className="source-thumbnail-state"><Play size={24}/><span>{src?"Thumbnail unavailable":"Watch at source"}</span>{src&&<button type="button" onClick={()=>{setAttempt(n=>n+1);setFailed(false);}}><RotateCcw size={14}/>Retry image</button>}{directUrl&&!direct&&<><span>Load directly from YouTube? This connects your browser to Google.</span><button onClick={()=>{setDirect(true);setFailed(false);}}>Load from YouTube</button></>}</span>;
 const image=<img key={`${src}-${revision}-${attempt}`} src={direct&&directUrl?directUrl:`${src}${src.includes("?")?"&":"?"}attempt=${attempt}`} alt={`Video thumbnail: ${title}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
 return onOpen?<button type="button" className="thumbnail-action" aria-label={`Open ${title}`} onClick={onOpen}>{image}<span className="thumbnail-play" aria-hidden="true"><Play size={22}/></span></button>:href?<a className="thumbnail-action" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${title} at source`}>{image}<span className="thumbnail-play" aria-hidden="true"><Play size={22}/></span></a>:image;
}
