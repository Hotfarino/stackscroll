"use client";
import {useState} from "react";
import type {Card} from "./content";
import {reviewedFeedImage} from "./visual-content";
import "./feed-image.css";

export function FeedImage({card,onOpen}:{card:Card;onOpen?:()=>void}){
 const [failed,setFailed]=useState<string>();
 const reviewed=reviewedFeedImage(card);
 const illustration=!reviewed&&["lesson","resource","story","podcast","humor"].includes(card.kind);
 if(!reviewed&&!illustration)return null;
 const hardware=["Networking","CompTIA","CCNA","Cloud","Data centers"].includes(card.topic);
 const src=reviewed?.src||`/media/cards/${card.kind==="humor"?"tech-break":hardware?"infrastructure":"agentic-systems"}.webp`;
 const image=<>{failed===src?<span className="feed-image-fallback">Image unavailable · {card.topic}<small>The card and original source are still available.</small></span>:<img src={src} alt={reviewed?.alt||""} width={960} height={540} loading="lazy" decoding="async" onError={()=>setFailed(src)}/>}<span className="feed-image-action">{onOpen?"Explore card":"View original image"}</span></>;
 return <figure className="feed-image"><div className="feed-image-frame">{onOpen?<button type="button" onClick={onOpen} aria-label={`Open ${card.title}`}>{image}</button>:<a href={reviewed?.source||card.source} target="_blank" rel="noopener noreferrer" aria-label={`Open image source for ${card.title}`}>{image}</a>}</div><figcaption>{reviewed?<><a href={reviewed.source} target="_blank" rel="noopener noreferrer">{reviewed.credit}</a><a href={reviewed.policy} target="_blank" rel="noopener noreferrer">{reviewed.license}</a><span>Resized / thumbnail crop · Archive {reviewed.date}</span></>:<span>AI topic artwork · illustrative, not a publisher image</span>}</figcaption></figure>;
}
