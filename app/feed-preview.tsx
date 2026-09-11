"use client";
import {useState, type ReactNode} from "react";
import {Bookmark, ChevronDown, ChevronUp, ExternalLink, Play} from "lucide-react";
import type {Card} from "./content";
import type {VideoRecord} from "./video-catalog";

export function FeedPreview({card,video,blocked,saved,onSave,onToggle,children}:{card:Card;video?:VideoRecord;blocked:boolean;saved:boolean;onSave:()=>void;onToggle:()=>void;children:ReactNode}) {
 const [open,setOpen]=useState(false),[failed,setFailed]=useState(false);
 const isVideo=card.kind==="video";
 const safeThumbnail=!blocked&&video&&video.thumbnail?.url===`/api/videos/thumbnail?id=${encodeURIComponent(video.id)}`?video.thumbnail.url:undefined;
 const art=card.kind==="humor"?"tech-break":["Networking","CCNA","CompTIA","Cloud","Data centers"].includes(card.topic)?"infrastructure":"agentic-systems";
 function toggle(){onToggle();setOpen(!open);}
 return <section className={`feed-preview ${open?"is-open":""}`} aria-label={card.title}>
  {!open&&<div className="preview-row"><div className="preview-copy"><div className="preview-meta"><span>{card.kind==="humor"?"Tech break":card.topic}</span><i aria-hidden="true"/><span>{card.minutes?`${card.minutes} min`:card.kind}</span></div><button className="preview-title" onClick={toggle} aria-expanded={open}><h2>{card.title}</h2></button>{(card.catalog?.excerpt||card.body)&&<p>{card.catalog?.excerpt||card.body}</p>}<div className="preview-controls"><a href={card.source} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/><span>{card.sourceName}</span></a><button aria-label={saved?`Unsave ${card.title}`:`Save ${card.title}`} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved?"currentColor":"none"}/><span>Save</span></button><button onClick={toggle} aria-expanded={open} aria-label={`Open ${card.title}`}><ChevronDown size={18}/><span>Open</span></button></div></div><button className="preview-image" onClick={toggle} aria-label={`Open ${card.title}`}>
   {isVideo? safeThumbnail&&!failed?<img src={safeThumbnail} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<span className="preview-video-fallback"><Play size={26}/>{blocked?"Preview blocked":"YouTube clip"}</span>:<img src={`/media/cards/${art}.webp`} alt="" loading="lazy" decoding="async"/>}<small>{isVideo?"YouTube":"AI concept artwork"}</small></button></div>}
  {open&&<><button className="preview-collapse" onClick={toggle} aria-expanded={open}><ChevronUp size={17}/>Close full card</button>{children}</>}
 </section>;
}
