import {topics,type Card,type Kind,type Topic} from "./content";
import type {TopicFeedback} from "./stacks";
export const feedRotation:Kind[]=["video","quote","story","explainer","news","lesson","quiz","podcast","flashcard","humor","resource"];
export function eligibleCard(card:Card,now=Date.now()):boolean {
 try{const url=new URL(card.source);return !!card.id&&!!card.title&&topics.includes(card.topic)&&feedRotation.includes(card.kind)&&url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&(!card.date||(Number.isFinite(Date.parse(card.date))&&Date.parse(card.date)<=now));}catch{return false;}
}
export function preferenceScore(card:Card,feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[]):number{
 const setting=feedback.find(item=>item.topic===card.topic)?.preference;
 return (path.includes(card.topic)?5:0)+(pinned.includes(card.topic)?3:0)+(setting==="more"?8:setting==="less"?-12:0)+(setting==="basic"?(card.level==="Foundation"?5:-5):setting==="advanced"?(card.level!=="Foundation"?5:-5):0);
}
export function feedReason(card:Card,feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[]):string{
 const setting=feedback.find(item=>item.topic===card.topic)?.preference;
 const reasons=[setting==="more"?"You asked for more of this topic.":setting==="less"?"You asked for less of this topic; it is ranked lower, not hidden.":setting==="basic"?"Difficulty preference: more foundational material.":setting==="advanced"?"Difficulty preference: more advanced material.":"",path.includes(card.topic)?"Related to your career direction.":"",pinned.includes(card.topic)?"One of your pinned topics.":""].filter(Boolean);
 return (reasons.join(" ")||"A curated tech pick for exploring the field.")+" The mix also balances formats and publishers, with discovery slots outside your selected topics when available. Viewing time is not used.";
}
export function mixedFeed(cards:Card[],feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[],now=Date.now()):Card[]{
 const ids=new Set<string>(),links=new Set<string>();
 const candidates=cards.filter(card=>{
  if(!eligibleCard(card,now)||ids.has(card.id))return false;
  const url=new URL(card.source);url.hash="";for(const key of [...url.searchParams.keys()])if(key.startsWith("utm_"))url.searchParams.delete(key);
  const external=card.catalog?.delivery==="source"||["news","video","podcast","story"].includes(card.kind);
  if(external&&links.has(url.href))return false;
  ids.add(card.id);if(external)links.add(url.href);return true;
 });
 // Cards sharing a topic, publisher and preference score have the same dynamic
 // penalty. Rank each bucket once, then compare only its next available card.
 const dates=new Map(candidates.map(card=>[card.id,Date.parse(card.date||"")||0]));
 const interests=new Set([...path,...pinned,...feedback.filter(f=>f.preference==="more").map(f=>f.topic)]);
 const less=new Set(feedback.filter(f=>f.preference==="less").map(f=>f.topic));
 type Bucket={cards:Card[];offset:number;base:number};
 const pools=new Map<Kind,Bucket[]>();
 const remaining=new Map<Kind,number>();
 for(const kind of feedRotation){
  const groups=new Map<string,Bucket>();
  for(const card of candidates.filter(card=>card.kind===kind)){
   const base=preferenceScore(card,feedback,path,pinned),key=JSON.stringify([card.topic,card.sourceName,base]);
   if(!groups.has(key))groups.set(key,{cards:[],offset:0,base});groups.get(key)!.cards.push(card);
  }
  if(["news","video","podcast"].includes(kind))for(const group of groups.values())group.cards.sort((a,b)=>dates.get(b.id)!-dates.get(a.id)!);
  pools.set(kind,[...groups.values()]);remaining.set(kind,[...groups.values()].reduce((sum,g)=>sum+g.cards.length,0));
 }
 const inputOrder=new Map(candidates.map((card,i)=>[card.id,i]));
 const output:Card[]=[];
 const kindHistory=new Map<Kind,Card[]>();
 function pick(kind:Kind){
  const groups=pools.get(kind)!;if(!remaining.get(kind))return;
  const recent=output.slice(-3),sameKind=kindHistory.get(kind)||[];
  const recentTopics=new Map<Topic,number>();for(const card of recent)recentTopics.set(card.topic,(recentTopics.get(card.topic)||0)+1);
  const publishers=new Set([...recent,...sameKind].map(card=>card.sourceName));
  const heads=groups.filter(g=>g.offset<g.cards.length);
  // Every fifth slot may explore an unselected topic, when this format has one.
  // Explicit "less" preferences are never used to fill the discovery slot.
  const explore=interests.size>0&&(output.length+1)%5===0;
  const outside=explore?heads.filter(g=>!interests.has(g.cards[g.offset].topic)&&!less.has(g.cards[g.offset].topic)):[];
  const options=outside.length?outside:heads;
  const score=(g:Bucket)=>g.base-(recentTopics.get(g.cards[g.offset].topic)||0)*4-(publishers.has(g.cards[g.offset].sourceName)?5:0);
  let best=options[0],bestScore=score(best);
  for(const candidate of options.slice(1)){
   const candidateScore=score(candidate),a=candidate.cards[candidate.offset],b=best.cards[best.offset];
   const chronological=["news","video","podcast"].includes(kind);
   const dateDelta=chronological?dates.get(a.id)!-dates.get(b.id)!:0;
   if(candidateScore>bestScore||(candidateScore===bestScore&&(dateDelta>0||(dateDelta===0&&inputOrder.get(a.id)!<inputOrder.get(b.id)!)))){best=candidate;bestScore=candidateScore;}
  }
  const card=best.cards[best.offset++];output.push(card);remaining.set(kind,remaining.get(kind)!-1);
  kindHistory.set(kind,[...sameKind,card].slice(-3));
 }
 for(const kind of feedRotation)pick(kind);
 // Sublinear weights prevent a prolific source/format from buying most slots
 // merely by supplying more cards. Inventory still remains fully accessible.
 const weights=new Map(feedRotation.map(kind=>[kind,Math.sqrt(remaining.get(kind)!)]));
 const credits=new Map(feedRotation.map(kind=>[kind,0]));
 while([...remaining.values()].some(count=>count>0)){
  const available=feedRotation.filter(kind=>remaining.get(kind)!>0);
  const total=available.reduce((sum,kind)=>sum+weights.get(kind)!,0);
  for(const kind of available)credits.set(kind,credits.get(kind)!+weights.get(kind)!);
  const last=output.at(-1)?.kind;
  const varied=output.slice(-3).length===3&&output.slice(-3).every(card=>card.kind===last)?available.filter(kind=>kind!==last):available;
  const choices=varied.length?varied:available;
  const chosen=choices.reduce((best,kind)=>credits.get(kind)!>credits.get(best)!?kind:best);
  credits.set(chosen,credits.get(chosen)!-total);pick(chosen);
 }
 return output;
}
