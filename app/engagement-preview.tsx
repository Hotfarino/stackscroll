"use client";
import {useMemo,useState} from "react";
import {mixedFeed,savedTopicSignals,stackInterestSuggestions} from "./mixed-feed";
import type {Card,Topic} from "./content";
import type {TopicFeedback} from "./stacks";
import {StackButton} from "./brand";
import {SheetClose} from "@/components/ui/sheet";
export function EngagementPreview({inventory,saved,feedback,path,pinned,layers,enabled,onBuild,onApply}:{inventory:Card[];saved:Card[];feedback:TopicFeedback[];path:Topic[];pinned:Topic[];layers:{topic:Topic;emphasis:number}[];enabled:boolean;onBuild:(topic:Topic)=>void;onApply:()=>void}){
 const [compare,setCompare]=useState(false);
 const suggestions=useMemo(()=>stackInterestSuggestions(saved,feedback,enabled),[saved,feedback,enabled]);
 const comparison=useMemo(()=>{
  if(!compare)return [];
  const before=mixedFeed(inventory,feedback,path,pinned,Date.now(),layers);
  const after=mixedFeed(inventory,feedback,path,pinned,Date.now(),layers,enabled?savedTopicSignals(saved):{});
  return suggestions.map(({topic})=>({topic,before:before.findIndex(card=>card.topic===topic)+1,after:after.findIndex(card=>card.topic===topic)+1}));
 },[compare,inventory,feedback,path,pinned,layers,enabled,saved,suggestions]);
 return <section className="engagement-preview"><h3>From saves to your next Stack</h3><p>Save two or more different cards in a topic to surface it here. Suggestions never create or change a Stack automatically.</p>{!enabled?<p>Save-based personalization is off.</p>:suggestions.length?suggestions.map(item=><div key={item.topic}><strong>{item.topic}</strong><p>{item.saves} saved cards on this device</p><SheetClose asChild><StackButton tone="secondary" onClick={()=>onBuild(item.topic)}>Draft a {item.topic} Stack</StackButton></SheetClose></div>):<p>No repeated saved-topic signal yet.</p>}<StackButton tone="quiet" onClick={()=>setCompare(value=>!value)}>{compare?"Hide comparison":"Test saved-topic influence"}</StackButton>{compare&&<div role="status"><p>Controlled comparison of the same available inventory: first position for each suggested topic, without saves → with saves. Your other settings stay fixed. Seen-card filtering and rotation can change the next live mix.</p>{comparison.length?comparison.map(row=><p key={row.topic}><strong>{row.topic}</strong>: {row.before||"not available"} → {row.after||"not available"}</p>):<p>Save two cards in one topic and enable personalization to compare it.</p>}</div>}<SheetClose asChild><StackButton tone="secondary" onClick={onApply}>Apply signals to next mix</StackButton></SheetClose><p>Refresh applies signals without reshuffling cards mid-scroll. Watch time and scrolling are not interest signals.</p></section>;
}
