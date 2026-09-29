import type {Card} from "./content";
import {discoveryVisuals,type DiscoveryVisual} from "./discovery-visuals";

const topicFallback:Partial<Record<Card["topic"],string>>={
 "Web & accessibility":"discovery-braille","Mobile development":"discovery-phone",Cybersecurity:"discovery-security",Networking:"discovery-fiber",CCNA:"discovery-antenna",CompTIA:"discovery-cpu",DevOps:"discovery-servers",Cloud:"discovery-servers","Data centers":"discovery-tape","Data engineering":"science-lidar-folsom","Machine learning":"science-cos7-actin","Robotics & IoT":"discovery-printer-voron","Agentic AI":"discovery-cpu","AI workflows":"discovery-servers",Development:"discovery-cpu",Languages:"discovery-cpu"
};

function score(work:DiscoveryVisual,text:string){return work.keywords.reduce((total,keyword)=>total+(text.includes(keyword.toLowerCase())?keyword.split(/\s+/).length+1:0),0);}
export function newsReferenceVisual(card:Pick<Card,"title"|"topic">){
 const text=card.title.toLowerCase(),ranked=discoveryVisuals.map(work=>({work,score:score(work,text)+(work.topic===card.topic?2:0)})).sort((a,b)=>b.score-a.score);
 const key=ranked[0]?.score?ranked[0].work.key:topicFallback[card.topic]||"discovery-servers",work=discoveryVisuals.find(item=>item.key===key)||discoveryVisuals[0];
 return {...work,image:`/media/licensed/${work.key}.webp`};
}
