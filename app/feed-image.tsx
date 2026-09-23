"use client";
import {useState} from "react";
import type {Card} from "./content";
import {reviewedFeedImage} from "./visual-content";
import "./feed-image.css";

export function FeedImage({card,onOpen}:{card:Card;onOpen?:()=>void}){
 const [failed,setFailed]=useState<string>();
 const reviewed=reviewedFeedImage(card);
 // No generic topic cover: a missing source image should not repeat the same
 // three illustrations across hundreds of unrelated cards.
 if(!reviewed)return null;
 const src=reviewed.src;
 const image=<>{failed===src?<span className="feed-image-fallback">Image unavailable · {card.topic}<small>The card and original source are still available.</small></span>:<img src={src} alt={reviewed?.alt||""} width={960} height={540} loading="lazy" decoding="async" onError={()=>setFailed(src)}/>}<span className="feed-image-action">{onOpen?"Explore card":"View original image"}</span></>;
 return <figure className="feed-image" data-full-image={reviewed.fit==="contain"||undefined}><div className="feed-image-frame">{onOpen?<button type="button" onClick={onOpen} aria-label={`Open ${card.title}`}>{image}</button>:<a href={reviewed?.source||card.source} target="_blank" rel="noopener noreferrer" aria-label={`Open image source for ${card.title}`}>{image}</a>}</div><figcaption>{reviewed?<><a href={reviewed.source} target="_blank" rel="noopener noreferrer">{reviewed.credit}</a><a href={reviewed.policy} target="_blank" rel="noopener noreferrer">{reviewed.license}</a><span>{reviewed.fit==="contain"?"Resized · full image":"Resized / thumbnail crop"}{reviewed.date?` · Archive ${reviewed.date}`:" · Reference image"}</span></>:<span>AI topic artwork · illustrative, not a publisher image</span>}</figcaption></figure>;
}
