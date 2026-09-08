import {topics,type Card,type Kind,type Topic} from "./content";
import type {TopicFeedback} from "./stacks";
export const feedRotation:Kind[]=["video","quote","story","explainer","news","lesson","quiz","podcast","flashcard"];
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
 return (reasons.join(" ")||"A curated tech pick for exploring the field.")+" The mix also balances formats, recent topics, and publishers. Viewing time is not used.";
}
export function mixedFeed(cards:Card[],feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[],now=Date.now()):Card[]{
 const ids=new Set<string>(),links=new Set<string>();
 const candidates=cards.filter(card=>{
  if(!eligibleCard(card,now)||ids.has(card.id))return false;
  const url=new URL(card.source);url.hash="";for(const key of [...url.searchParams.keys()])if(key.startsWith("utm_"))url.searchParams.delete(key);
  const external=["news","video","podcast","story"].includes(card.kind);
  if(external&&links.has(url.href))return false;
  ids.add(card.id);if(external)links.add(url.href);return true;
 });
 const pools=new Map(feedRotation.map(kind=>[kind,candidates.filter(card=>card.kind===kind)]));
 const output:Card[]=[];
 while([...pools.values()].some(pool=>pool.length))for(const kind of feedRotation){
  const pool=pools.get(kind)!;if(!pool.length)continue;
  const recent=output.slice(-3);
  const score=(card:Card)=>preferenceScore(card,feedback,path,pinned)-recent.filter(item=>item.topic===card.topic).length*4-(recent.some(item=>item.sourceName===card.sourceName)?5:0);
  pool.sort((a,b)=>score(b)-score(a)||(["news","video","podcast"].includes(kind)?(Date.parse(b.date||"")||0)-(Date.parse(a.date||"")||0):0));
  output.push(pool.shift()!);
 }
 return output;
}
