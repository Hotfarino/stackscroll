import {topics,type Card,type Kind,type Topic} from "./content";
import type {TopicFeedback} from "./stacks";
export const feedRotation:Kind[]=["video","quote","story","explainer","news","lesson","quiz","podcast","flashcard","humor","resource"];
// Publisher labels can vary between imports. Group by canonical source instead.
// Shared platforms keep creators/owners separate rather than becoming one source.
export function publisherKey(card:Card):string{
 try{const url=new URL(card.source),host=url.hostname.replace(/^www\./,"");
  if(host==="youtu.be"||host==="youtube.com")return `youtube:${card.sourceName.toLowerCase()}`;
  if(host==="github.com")return `github:${url.pathname.split("/")[1]?.toLowerCase()}`;
  if(host==="commons.wikimedia.org")return `commons:${card.sourceName.toLowerCase()}`;
  if(host.endsWith(".amazon.com")||host==="aws.amazon.com")return "aws.amazon.com";
  return host;
 }catch{return card.sourceName.toLowerCase();}
}
export function eligibleCard(card:Card,now=Date.now()):boolean {
 try{const url=new URL(card.source);return !!card.id&&!!card.title&&topics.includes(card.topic)&&feedRotation.includes(card.kind)&&url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&(!card.date||(Number.isFinite(Date.parse(card.date))&&Date.parse(card.date)<=now));}catch{return false;}
}
export function savedTopicSignals(saved:Card[]):Partial<Record<Topic,number>> {
 const result:Partial<Record<Topic,number>>={};
 for(const card of new Map(saved.map(card=>[card.id,card])).values())if(topics.includes(card.topic))result[card.topic]=Math.min(6,(result[card.topic]||0)+2);
 return result;
}
export function stackInterestSuggestions(saved:Card[],feedback:TopicFeedback[],enabled=true):{topic:Topic;saves:number}[]{
 if(!enabled)return [];
 const counts=new Map<Topic,number>();
 for(const card of new Map(saved.filter(eligible=>topics.includes(eligible.topic)).map(card=>[card.id,card])).values())counts.set(card.topic,(counts.get(card.topic)||0)+1);
 return [...counts].filter(([topic,count])=>count>=2&&feedback.find(item=>item.topic===topic)?.preference!=="less").sort((a,b)=>b[1]-a[1]||topics.indexOf(a[0])-topics.indexOf(b[0])).slice(0,3).map(([topic,saves])=>({topic,saves}));
}
export function preferenceScore(card:Card,feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[],layers:{topic:Topic;emphasis:number}[]=[],affinity:Partial<Record<Topic,number>>={}):number{
 const setting=feedback.find(item=>item.topic===card.topic)?.preference;
 return (setting==="less"?0:Math.max(0,Math.min(6,affinity[card.topic]||0)))+(layers.find(layer=>layer.topic===card.topic)?.emphasis||0)*6+(path.includes(card.topic)?5:0)+(pinned.includes(card.topic)?3:0)+(setting==="more"?8:setting==="less"?-12:0)+(setting==="basic"?(card.level==="Foundation"?5:-5):setting==="advanced"?(card.level!=="Foundation"?5:-5):0);
}
export function feedReason(card:Card,feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[],layers:{topic:Topic;emphasis:number}[]=[],affinity:Partial<Record<Topic,number>>={}):string{
 const setting=feedback.find(item=>item.topic===card.topic)?.preference;
 const reasons=[affinity[card.topic]&&setting!=="less"?"Related to topics in your saved cards on this device.":"",layers.some(layer=>layer.topic===card.topic)?"Matches a topic in your selected Stack.":"",setting==="more"?"You asked for more of this topic.":setting==="less"?"You asked for less of this topic; it is ranked lower, not hidden.":setting==="basic"?"Difficulty preference: more foundational material.":setting==="advanced"?"Difficulty preference: more advanced material.":"",path.includes(card.topic)?"Related to your career direction.":"",pinned.includes(card.topic)?"One of your pinned topics.":""].filter(Boolean);
 return (reasons.join(" ")||"A curated tech pick for exploring the field.")+" The mix also balances topics, formats, and publishers, with discovery slots outside your selected topics when available. Viewing time is not used.";
}
export function mixedFeed(cards:Card[],feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[],now=Date.now(),layers:{topic:Topic;emphasis:number}[]=[],affinity:Partial<Record<Topic,number>>={}):Card[]{
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
 const publisherIds=new Map(candidates.map(card=>[card.id,publisherKey(card)]));
 const publisherOf=(card:Card)=>publisherIds.get(card.id)!;
 const interests=new Set([...topics.filter(topic=>(affinity[topic]||0)>0),...layers.map(layer=>layer.topic),...path,...pinned,...feedback.filter(f=>f.preference==="more").map(f=>f.topic)]);
 const less=new Set(feedback.filter(f=>f.preference==="less").map(f=>f.topic));
 type Bucket={cards:Card[];offset:number;base:number};
 const pools=new Map<Kind,Bucket[]>();
 const remaining=new Map<Kind,number>();
 for(const kind of feedRotation){
  const groups=new Map<string,Bucket>();
  for(const card of candidates.filter(card=>card.kind===kind)){
   const base=preferenceScore(card,feedback,path,pinned,layers,affinity),key=JSON.stringify([card.topic,publisherOf(card),base,card.id.startsWith("visual-")]);
   if(!groups.has(key))groups.set(key,{cards:[],offset:0,base});groups.get(key)!.cards.push(card);
  }
  if(["news","video","podcast"].includes(kind))for(const group of groups.values())group.cards.sort((a,b)=>dates.get(b.id)!-dates.get(a.id)!);
  pools.set(kind,[...groups.values()]);remaining.set(kind,[...groups.values()].reduce((sum,g)=>sum+g.cards.length,0));
 }
 const inputOrder=new Map(candidates.map((card,i)=>[card.id,i]));
 const output:Card[]=[];
 const kindHistory=new Map<Kind,Card[]>();
 const topicExposure=new Map<Topic,number>();
 function pick(kind:Kind){
  const groups=pools.get(kind)!;if(!remaining.get(kind))return;
  const recent=output.slice(-3),sameKind=kindHistory.get(kind)||[];
  const recentTopics=new Map<Topic,number>();for(const card of recent)recentTopics.set(card.topic,(recentTopics.get(card.topic)||0)+1);
  const publishers=new Map<string,number>();
  for(const card of output.slice(-6))publishers.set(publisherOf(card),(publishers.get(publisherOf(card))||0)+1);
  const samePublishers=new Set(sameKind.map(publisherOf));
  const heads=groups.filter(g=>g.offset<g.cards.length);
  // Every fifth slot may explore an unselected topic, when this format has one.
  // Explicit "less" preferences are never used to fill the discovery slot.
  const explore=interests.size>0&&(output.length+1)%5===0;
  const outside=explore?heads.filter(g=>!interests.has(g.cards[g.offset].topic)&&!less.has(g.cards[g.offset].topic)):[];
  const options=outside.length?outside:heads;
  // Give the curated visual series a modest discovery lift, not extra format
  // slots; explicit topic preferences and balance still outweigh this signal.
  const visualGap=!output.slice(-4).some(card=>card.id.startsWith("visual-"));
  const score=(g:Bucket)=>{const card=g.cards[g.offset],publisher=publisherOf(card);return g.base+(visualGap&&card.id.startsWith("visual-")?3:0)-(topicExposure.get(card.topic)||0)*3-(recentTopics.get(card.topic)||0)*5-(publishers.get(publisher)||0)*4-(samePublishers.has(publisher)?2:0);};
  let best=options[0],bestScore=score(best);
  for(const candidate of options.slice(1)){
   const candidateScore=score(candidate),a=candidate.cards[candidate.offset],b=best.cards[best.offset];
   const chronological=["news","video","podcast"].includes(kind);
   const dateDelta=chronological?dates.get(a.id)!-dates.get(b.id)!:0;
   if(candidateScore>bestScore||(candidateScore===bestScore&&(dateDelta>0||(dateDelta===0&&inputOrder.get(a.id)!<inputOrder.get(b.id)!)))){best=candidate;bestScore=candidateScore;}
  }
  const card=best.cards[best.offset++];output.push(card);remaining.set(kind,remaining.get(kind)!-1);
  topicExposure.set(card.topic,(topicExposure.get(card.topic)||0)+1);
  kindHistory.set(kind,[...sameKind,card].slice(-3));
 }
 for(const kind of feedRotation)pick(kind);
 // Weighted fair scheduling spreads scarce formats across the complete feed
 // instead of exhausting every small bucket near the beginning. Topic and
 // publisher penalties still choose the best card within each format.
 const weights=new Map(feedRotation.map(kind=>[kind,Math.max(0,remaining.get(kind)!)]));
 const credits=new Map(feedRotation.map(kind=>[kind,0]));
 let weighted=false;
 while([...remaining.values()].some(count=>count>0)){
  const available=feedRotation.filter(kind=>remaining.get(kind)!>0);
  const opening=output.length<40;
  if(!opening&&!weighted){for(const kind of feedRotation)credits.set(kind,0);weighted=true;}
  const weight=(kind:Kind)=>opening?1:weights.get(kind)!;
  const total=available.reduce((sum,kind)=>sum+weight(kind),0);
  for(const kind of available)credits.set(kind,credits.get(kind)!+weight(kind));
  const last=output.at(-1)?.kind;
  const varied=output.slice(-3).length===3&&output.slice(-3).every(card=>card.kind===last)?available.filter(kind=>kind!==last):available;
  const choices=varied.length?varied:available;
  const chosen=choices.reduce((best,kind)=>credits.get(kind)!>credits.get(best)!?kind:best);
  credits.set(chosen,credits.get(chosen)!-total);pick(chosen);
 }
 // Long catalogs should not consume a scarce format before a reader reaches
 // later sections. Keep at least one representative in every quarter when the
 // inventory can support it; swapping preserves uniqueness and total balance.
 if(output.length>=200){
  const size=Math.ceil(output.length/4);
  for(const kind of feedRotation){
   if(output.filter(card=>card.kind===kind).length<4)continue;
   for(let quarter=0;quarter<4;quarter++){
    const start=quarter*size,end=Math.min(output.length,start+size);
    if(output.slice(start,end).some(card=>card.kind===kind))continue;
    const donor=[0,1,2,3].find(candidate=>candidate!==quarter&&output.slice(candidate*size,Math.min(output.length,(candidate+1)*size)).filter(card=>card.kind===kind).length>1);
    if(donor===undefined)continue;
    const from=output.findLastIndex((card,index)=>card.kind===kind&&index>=donor*size&&index<Math.min(output.length,(donor+1)*size));
    const to=Math.min(end-1,start+Math.floor((end-start)/2));
    [output[from],output[to]]=[output[to],output[from]];
   }
  }
 }
 return output;
}
