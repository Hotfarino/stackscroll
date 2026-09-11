"use client";
import {SourceThumbnail} from "./source-thumbnail";
import {youtubeLinkId} from "./youtube-link";
import {useState, type ReactNode} from "react";
import {ChevronDown, ChevronUp, ExternalLink, Play} from "lucide-react";
import {Bookmark} from "./reference-bookmark";
import {ReferenceIcon} from "./reference-icon";
import type {Card} from "./content";
import type {VideoRecord} from "./video-catalog";

export function FeedPreview({card,video,blocked,saved,onSave,onToggle,children}:{card:Card;video?:VideoRecord;blocked:boolean;saved:boolean;onSave:()=>void;onToggle:()=>void;children:ReactNode}) {
 const [open,setOpen]=useState(false);
 const isVideo=card.kind==="video";
 const safeThumbnail=video&&video.thumbnail?.url===`/api/videos/thumbnail?id=${encodeURIComponent(video.id)}`?video.thumbnail.url:card.catalog&&youtubeLinkId(card.source)?`/api/catalog/thumbnail?id=${encodeURIComponent(card.id)}`:undefined;
 const art=card.kind==="humor"?"tech-break":["Networking","CCNA","CompTIA","Cloud","Data centers"].includes(card.topic)?"infrastructure":"agentic-systems";
 function toggle(){onToggle();setOpen(!open);}
 return <section className={`feed-preview ${open?"is-open":""}`} aria-label={card.title}>
  {!open&&<div className="preview-row"><div className="preview-copy"><div className="preview-meta"><span>{card.kind==="humor"?"Tech break":card.topic}</span><i aria-hidden="true"/><span>{card.minutes?`${card.minutes} min`:card.kind}</span></div><button className="preview-title" onClick={toggle} aria-expanded={open}><h2>{card.title}</h2></button>{(card.catalog?.excerpt||card.body)&&<p>{card.catalog?.excerpt||card.body}</p>}<div className="preview-controls"><a href={card.source} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/><span>{card.sourceName}</span></a><button aria-label={saved?`Unsave ${card.title}`:`Save ${card.title}`} aria-pressed={saved} onClick={onSave}><ReferenceIcon name="saved" size={25}/><span>Save</span></button><button onClick={toggle} aria-expanded={open} aria-label={`Open ${card.title}`}><ChevronDown size={18}/><span>Open</span></button></div></div><div className="preview-image">
   {isVideo?<SourceThumbnail src={safeThumbnail} title={card.title} blocked={blocked} revision={video?.rights.checkedAt}/>:<img src={`/media/cards/${art}.webp`} alt="" loading="lazy" decoding="async"/>}<small>{isVideo?"YouTube":"AI concept artwork"}</small></div></div>}
  {open&&<><button className="preview-collapse" onClick={toggle} aria-expanded={open}><ChevronUp size={17}/>Close full card</button>{children}</>}
 </section>;
}
