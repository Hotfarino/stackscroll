"use client";
import {useEffect,useState} from "react";
import {Play,RotateCcw} from "lucide-react";

// Shared by compact and expanded cards. A fresh source check permits a retry.
export function SourceThumbnail({src,title,blocked=false,revision=""}:{src?:string;title:string;blocked?:boolean;revision?:string}){
 const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{setFailed(false);setAttempt(0);},[src,revision,blocked]);
 if(blocked)return <span className="source-thumbnail-state"><Play size={24}/>Preview blocked</span>;
 if(!src||failed)return <span className="source-thumbnail-state"><Play size={24}/><span>{src?"Thumbnail unavailable":"Watch at source"}</span>{src&&<button type="button" onClick={()=>{setAttempt(n=>n+1);setFailed(false);}}><RotateCcw size={14}/>Retry image</button>}</span>;
 return <img key={`${src}-${revision}-${attempt}`} src={`${src}${src.includes("?")?"&":"?"}attempt=${attempt}`} alt={`Video thumbnail: ${title}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
}
