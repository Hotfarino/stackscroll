import type {Card,Kind,Topic} from "./content";
import type {TopicFeedback} from "./stacks";

// Explicit preferences choose within each format. A format rotation keeps the
// broad discovery feed from collapsing into only quizzes, news, or one creator.
const rotation:Kind[]=["video","quote","explainer","news","lesson","quiz","flashcard"];
export function mixedFeed(cards:Card[],feedback:TopicFeedback[],path:Topic[]=[],pinned:Topic[]=[]):Card[]{
 const score=(card:Card)=>{
  const preference=feedback.find(item=>item.topic===card.topic)?.preference;
  return (path.includes(card.topic)?5:0)+(pinned.includes(card.topic)?3:0)+(preference==="more"?6:preference==="less"?-10:0)+(preference==="basic"?(card.level==="Foundation"?4:-4):preference==="advanced"?(card.level!=="Foundation"?4:-4):0);
 };
 const pools=new Map(rotation.map(kind=>[kind,cards.filter(card=>card.kind===kind).sort((a,b)=>score(b)-score(a)||((kind==="news"||kind==="video")?(Date.parse(b.date||"")||0)-(Date.parse(a.date||"")||0):0))]));
 const output:Card[]=[];const seen=new Set<string>();
 while([...pools.values()].some(pool=>pool.length))for(const kind of rotation){const card=pools.get(kind)?.shift();if(card&&!seen.has(card.id)){output.push(card);seen.add(card.id);}}
 return output;
}
