"use client";
import {startTransition,useEffect,useRef,type RefObject} from "react";
import type {Card} from "./content";
import {reviewedFeedImage} from "./visual-content";

export const FEED_BATCH_SIZE=6;
export function nextFeedLimit(current:number,total:number){return Math.min(current+FEED_BATCH_SIZE,total);}
export function nextImageBatch(cards:Card[],limit:number){return [...new Set(cards.slice(limit,limit+FEED_BATCH_SIZE).map(card=>reviewedFeedImage(card)?.src).filter((src):src is string=>!!src))].slice(0,3);}

export function useContinuousFeed({enabled,sentinel,cards,limit,onMore}:{enabled:boolean;sentinel:RefObject<HTMLDivElement|null>;cards:Card[];limit:number;onMore:()=>void}){
 const warmed=useRef(new Set<string>());
 const latest=useRef({cards,limit,onMore});latest.current={cards,limit,onMore};
 useEffect(()=>{
  if(!enabled||limit>=cards.length||!sentinel.current||typeof IntersectionObserver==="undefined")return;
  let frame:number|undefined,queued=false;
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  const warm=new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting)||document.hidden)return;
   if(connection?.saveData||connection?.effectiveType?.includes("2g"))return;
   for(const src of nextImageBatch(latest.current.cards,latest.current.limit)){
    if(warmed.current.has(src))continue;
    if(warmed.current.size>=128)warmed.current.delete(warmed.current.values().next().value!);
    warmed.current.add(src);const image=new Image();image.decoding="async";image.src=src;
   }
   warm.disconnect();
  },{rootMargin:"1800px 0px",threshold:0});
  const reveal=new IntersectionObserver(entries=>{
   if(queued||document.hidden||!entries.some(entry=>entry.isIntersecting))return;
   queued=true;reveal.disconnect();
   frame=requestAnimationFrame(()=>startTransition(()=>latest.current.onMore()));
  },{rootMargin:"800px 0px",threshold:0});
  const target=sentinel.current;
  const resume=()=>{if(!document.hidden&&!queued){warm.unobserve(target);reveal.unobserve(target);warm.observe(target);reveal.observe(target);}};
  warm.observe(target);reveal.observe(target);document.addEventListener("visibilitychange",resume);
  return()=>{warm.disconnect();reveal.disconnect();document.removeEventListener("visibilitychange",resume);if(frame!==undefined)cancelAnimationFrame(frame);};
 },[enabled,limit,cards,sentinel]);
}
