"use client";
import {useState} from "react";
import type {Card} from "./content";
import {newsImageUrl} from "./news";

export function NewsThumbnail({card}:{card:Card}){
 const [failed,setFailed]=useState<string>();
 const src=card.newsImage?newsImageUrl(card.newsImage):undefined;
 if(!src||failed===src)return null;
 return <a className="news-thumbnail" href={card.source} target="_blank" rel="noopener noreferrer" aria-label={`Read ${card.title} at ${card.sourceName}`}>
  <img src={src} alt={`Article image from ${card.sourceName}`} width={800} height={450} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(src)}/>
 </a>;
}
