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
 return (reasons.join(" ")||"A curated tech pick for exploring the field.")+" The mix also balances formats, recent topics, and publishers. Viewing time is not used.";
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
 const pools=new Map(feedRotation.map(kind=>[kind,candidates.filter(card=>card.kind===kind)]));
 const baseScores=new Map(candidates.map(card=>[card.id,preferenceScore(card,feedback,path,pinned)]));
 const dates=new Map(candidates.map(card=>[card.id,Date.parse(card.date||"")||0]));
 const output:Card[]=[];
 function pick(kind:Kind){
  const pool=pools.get(kind)!;if(!pool.length)return;
  const recent=output.slice(-3);
  const recentTopics=new Map<Topic,number>();for(const card of recent)recentTopics.set(card.topic,(recentTopics.get(card.topic)||0)+1);
  const recentPublishers=new Set(recent.map(card=>card.sourceName));
  const score=(card:Card)=>baseScores.get(card.id)!-(recentTopics.get(card.topic)||0)*4-(recentPublishers.has(card.sourceName)?5:0);
  // One scan preserves stable ties and avoids sorting the whole pool for each card.
  let best=0,bestScore=score(pool[0]);
  for(let i=1;i<pool.length;i++){
   const candidateScore=score(pool[i]);
   const newer=["news","video","podcast"].includes(kind)&&dates.get(pool[i].id)!>dates.get(pool[best].id)!;
   if(candidateScore>bestScore||(candidateScore===bestScore&&newer)){best=i;bestScore=candidateScore;}
  }
  output.push(pool.splice(best,1)[0]);
 }
 // Begin with a format sampler, then spread the remaining inventory through the
 // selection. Scarce formats should not all disappear at the top of a long feed.
 for(const kind of feedRotation)pick(kind);
 const weights=new Map(feedRotation.map(kind=>[kind,pools.get(kind)!.length]));
 const credits=new Map(feedRotation.map(kind=>[kind,0]));
 while([...pools.values()].some(pool=>pool.length)){
  const available=feedRotation.filter(kind=>pools.get(kind)!.length);
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
