"use client";
import {explainers} from "./media-content";
import {SourceThumbnail} from "./source-thumbnail";
import {NewsThumbnail} from "./news-thumbnail";
import {youtubeLinkId} from "./youtube-link";
import {useState, type ReactNode} from "react";
import {ChevronDown, ChevronUp, ExternalLink, Play} from "lucide-react";
import {Bookmark} from "./reference-bookmark";
import {ReferenceIcon} from "./reference-icon";
import type {Card} from "./content";
import type {VideoRecord} from "./video-catalog";

export function FeedPreview({card,video,blocked,saved,onSave,onToggle,onPlay,children}:{card:Card;video?:VideoRecord;blocked:boolean;saved:boolean;onSave:()=>void;onToggle:()=>void;onPlay?:()=>void;children:ReactNode}) {
 const [open,setOpen]=useState(false);
 const isVideo=card.kind==="video";
 const original=card.kind==="explainer"?explainers.find(clip=>clip.id===card.id):undefined;
 const safeThumbnail=video&&video.thumbnail?.url===`/api/videos/thumbnail?id=${encodeURIComponent(video.id)}`?video.thumbnail.url:card.catalog&&youtubeLinkId(card.source)?`/api/catalog/thumbnail?id=${encodeURIComponent(card.id)}`:undefined;
 function toggle(play=false){onToggle();setOpen(current=>!current);if(play&&!open)onPlay?.();}
 return <section className={`feed-preview kind-${card.kind} ${isVideo||original?"media-preview":""} ${open?"is-open":""}`} aria-label={card.title}>
  {!open&&card.kind==="news"&&<NewsThumbnail card={card}/>}
  {!open&&<div className="preview-row"><div className="preview-copy"><div className="preview-meta"><span>{card.kind==="humor"?"Tech break":card.topic}</span><i aria-hidden="true"/><span>{card.minutes?`${card.minutes} min`:card.kind}</span></div><button className="preview-title" onClick={()=>toggle()} aria-expanded={open}><h2>{card.title}</h2></button>{(card.catalog?.excerpt||card.body)&&<p>{card.catalog?.excerpt||card.body}</p>}<div className="preview-controls"><a href={card.source} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/><span>{card.sourceName}</span></a><button aria-label={saved?`Unsave ${card.title}`:`Save ${card.title}`} aria-pressed={saved} onClick={onSave}><ReferenceIcon name="saved" size={25}/><span>Save</span></button><button onClick={()=>toggle()} aria-expanded={open} aria-label={`Open ${card.title}`}><ChevronDown size={18}/><span>Open</span></button></div></div><div className="preview-image">
   {isVideo?<SourceThumbnail src={safeThumbnail} title={card.title} blocked={blocked} revision={video?.rights.checkedAt} onOpen={()=>toggle(true)}/>:original?<button type="button" className="thumbnail-action" aria-label={`Open ${card.title}`} aria-expanded={open} onClick={()=>toggle()}><img src={original.poster} alt="" loading="lazy" decoding="async"/></button>:null}{(isVideo||original)&&<small>{isVideo?"YouTube":"Stackscroll original"}</small>}</div></div>}
  {open&&<><button className="preview-collapse" onClick={()=>toggle()} aria-expanded={open}><ChevronUp size={17}/>Close full card</button>{children}</>}
 </section>;
}
