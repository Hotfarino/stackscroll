"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import type {Card,Topic} from "./content";
import type {TopicFeedback} from "./stacks";
import {mixedFeed} from "./mixed-feed";
import {FEED_MEMORY_KEY,emptyFeedMemory,parseFeedMemory,feedCandidates,rotatedCandidates,stableFeed} from "./feed-memory";

export function useFeedMemory(inventory:Card[],feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[]) {
 const memory=useRef(emptyFeedMemory()),latest=useRef({inventory,feedback,path,pinned});latest.current={inventory,feedback,path,pinned};
 const writable=useRef(true),baseline=useRef(new Set<string>());
 const [ready,setReady]=useState(false),[storageOk,setStorageOk]=useState(true),[revision,setRevision]=useState(0);
 const [snapshot,setSnapshot]=useState<{ids:string[];revisited:Set<string>}>({ids:[],revisited:new Set()});
 const revisit=useRef(false);
 const persist=useCallback(()=>{if(!writable.current)return;try{memory.current=parseFeedMemory(JSON.stringify(memory.current));localStorage.setItem(FEED_MEMORY_KEY,JSON.stringify(memory.current));}catch{writable.current=false;setStorageOk(false);}},[]);
 useEffect(()=>{try{memory.current=parseFeedMemory(localStorage.getItem(FEED_MEMORY_KEY));}catch{writable.current=false;setStorageOk(false);}setReady(true);},[]);
 useEffect(()=>{
  if(!ready)return;
  const {inventory,feedback,path,pinned}=latest.current;
  memory.current.seed=(memory.current.seed+1)%2147483647;
  const pool=rotatedCandidates(feedCandidates(inventory,memory.current,Date.now(),revisit.current),memory.current.seed);
  const unseen=pool.filter(card=>!memory.current.seen[card.id]),seen=pool.filter(card=>!!memory.current.seen[card.id]);
  const rank=(cards:Card[])=>mixedFeed(cards,feedback,path,pinned);
  const result=[...rank(unseen),...rank(seen)];
  baseline.current=new Set(inventory.map(card=>card.id));
  setSnapshot({ids:result.map(card=>card.id),revisited:new Set(seen.map(card=>card.id))});persist();
 },[ready,revision,persist]);
 const rotate=useCallback((allowRecent=false)=>{revisit.current=allowRecent;setRevision(value=>value+1);},[]);
 const markSeen=useCallback((id:string)=>{memory.current.seen[id]=Date.now();persist();},[persist]);
 const dismiss=useCallback((id:string)=>{
  if(!memory.current.dismissed.includes(id)&&memory.current.dismissed.length>=5000)return false;
  memory.current.dismissed=[...new Set([...memory.current.dismissed,id])];persist();
  setSnapshot(current=>({...current,ids:current.ids.filter(value=>value!==id)}));return true;
 },[persist]);
 const restoreDismissed=useCallback(()=>{memory.current.dismissed=[];persist();rotate();},[persist,rotate]);
 const clearSeen=useCallback(()=>{memory.current.seen={};persist();rotate();},[persist,rotate]);
 const cards=useMemo(()=>stableFeed(snapshot.ids,inventory),[snapshot,inventory]);
 const pendingCount=ready?feedCandidates(inventory,memory.current).filter(card=>!baseline.current.has(card.id)).length:0;
 return {ready,cards,pendingCount,rotate,markSeen,dismiss,restoreDismissed,clearSeen,storageOk,revisited:snapshot.revisited};
}

export function FeedExposure({id,enabled,onSeen,children}:{id:string;enabled:boolean;onSeen:(id:string)=>void;children:ReactNode}) {
 const element=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!enabled||!element.current||typeof IntersectionObserver==="undefined")return;
  let timer:ReturnType<typeof setTimeout>|undefined,recorded=false,visible=false;
  const cancel=()=>{clearTimeout(timer);timer=undefined;};
  const schedule=()=>{cancel();if(visible&&!document.hidden&&!recorded)timer=setTimeout(()=>{if(!document.hidden){recorded=true;onSeen(id);observer.disconnect();}},750);};
  const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=0.25);schedule();},{threshold:[0,0.25]});
  observer.observe(element.current);document.addEventListener("visibilitychange",schedule);
  return()=>{cancel();observer.disconnect();document.removeEventListener("visibilitychange",schedule);};
 },[enabled,id,onSeen]);
 return <div ref={element} className="feed-item">{children}</div>;
}
