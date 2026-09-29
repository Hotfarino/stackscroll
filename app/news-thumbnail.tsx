"use client";
import {useState} from "react";
import type {Card} from "./content";
import {newsImageUrl} from "./news";
import {permittedNewsImage} from "./content-rights";
import {newsReferenceVisual} from "./news-visuals";

export function NewsThumbnail({card}:{card:Card}){
 const [failed,setFailed]=useState<string>();
 const permitted=permittedNewsImage(card);
 const src=permitted?newsImageUrl(permitted):undefined;
 const reference=newsReferenceVisual(card),fallback=!src||failed===src,shown=fallback?reference.image:src;
 return <figure className="news-thumbnail"><a href={card.source} target="_blank" rel="noopener noreferrer" aria-label={`Read ${card.title} at ${card.sourceName}`}>
  <img src={shown} alt={src?`Article image from ${card.sourceName}`:reference.alt} width={800} height={450} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>{if(src)setFailed(src);}}/>
 </a>{fallback&&<figcaption><span>Topic reference image</span><a href={reference.source} target="_blank" rel="noopener noreferrer">{reference.credit}</a><a href={reference.policy} target="_blank" rel="noopener noreferrer">{reference.license}</a></figcaption>}
 </figure>;
}
