import {permittedCatalogExcerpt,permittedCardBody} from "./content-rights";
import type {Card} from "./content";
import {quotes,explainers} from "./media-content";
import type {VideoRecord} from "./video-catalog";
// Curated equivalents, not broad topic ORs: every meaningful query concept
// must still match. Keep short technical tokens (AI, IP, C++, C#) exact.
const aliases=[
 ["k8s","kubernetes"], ["a11y","accessibility","accessible"],
 ["js","javascript"], ["ts","typescript"], ["py","python"],
 ["ml","machine learning"], ["ai","artificial intelligence"],
 ["llm","large language model"], ["rag","retrieval augmented generation"],
 ["iot","internet of things"], ["ci cd","cicd","continuous integration","continuous delivery"],
 ["devops","development operations"], ["sre","site reliability engineering"],
 ["iac","infrastructure as code"], ["aws","amazon web services"],
 ["gcp","google cloud"], ["dns","domain name system","name resolution"],
 ["tls","transport layer security"], ["ssh","secure shell"],
 ["mfa","multi factor authentication","multifactor authentication"],
 ["2fa","two factor authentication"], ["sql","structured query language"],
 ["etl","extract transform load"], ["api","application programming interface"],
 ["gpu","graphics processing unit"], ["cpu","central processing unit"],
 ["ssd","solid state drive"], ["ui","user interface"], ["ux","user experience"],
 ["cv","computer vision"], ["nlp","natural language processing"],
 ["cybersecurity","cyber security","infosec","information security"],
 ["wifi","wi fi"], ["3d printing","additive manufacturing"],
 ["robot","robotics"], ["meme","memes","humor","funny"],
];
const stopWords=new Set(["a","an","the","for","of","to","in","on","and","with","how","what","is","are","about","learn"]);
function tokens(value:string):string[]{
 return value.normalize("NFKD").replace(/\p{M}/gu,"").toLocaleLowerCase("en-US").replace(/[’‘]/g,"'").match(/[\p{L}\p{N}]+(?:\+\+|#|\+)?/gu)||[];
}
function stem(word:string){
 if(word.length>5&&word.endsWith("ies"))return word.slice(0,-3)+"y";
 return word.length>4&&word.endsWith("s")&&!/(ss|us|is)$/.test(word)?word.slice(0,-1):word;
}
const groups=aliases.map(group=>group.map(term=>tokens(term).map(stem).join(" ")));
const aliasIndex=new Map(groups.flatMap(group=>group.map(term=>[term,group] as const)));
type Concept={literal:string;alternatives:string[]};
function concepts(query:string):Concept[]{
 const words=tokens(query.slice(0,200)).map(stem),result:Concept[]=[];
 for(let i=0;i<words.length;){
  let found=false;
  for(let count=Math.min(4,words.length-i);count>0;count--){
   const literal=words.slice(i,i+count).join(" "),group=aliasIndex.get(literal);
   if(group){result.push({literal,alternatives:group});i+=count;found=true;break;}
  }
  if(!found){const literal=words[i++];if(!stopWords.has(literal))result.push({literal,alternatives:[literal]});}
 }
 return result;
}
type Field={text:string;words:string[];weight:number};
function field(value:string|undefined,weight:number):Field{
 const words=tokens(value||"").map(stem);return {text:` ${words.join(" ")} `,words,weight};
}
// One insertion/deletion/substitution or adjacent transposition, only for long
// words. Avoid turning short acronyms or code languages into unrelated matches.
function oneEdit(a:string,b:string){
 if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1)return false;
 let i=0;while(i<a.length&&a[i]===b[i])i++;
 if(i===a.length)return b.length===a.length+1;
 if(a.length===b.length)return a.slice(i+1)===b.slice(i+1)||(a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
 return a.length>b.length?a.slice(i+1)===b.slice(i):a.slice(i)===b.slice(i+1);
}
function scoreFields(fields:Field[],query:Concept[]):number{
 let total=0;
 for(const concept of query){
  let best=0;
  for(const f of fields){
   if(f.text.includes(` ${concept.literal} `)){best=Math.max(best,f.weight);continue;}
   if(concept.alternatives.some(term=>f.text.includes(` ${term} `))){best=Math.max(best,f.weight*.8);continue;}
   if(!concept.literal.includes(" ")&&concept.literal.length>=5){
    if(f.words.some(word=>word.startsWith(concept.literal)))best=Math.max(best,f.weight*.45);
    else if(f.words.some(word=>oneEdit(concept.literal,word)))best=Math.max(best,f.weight*.25);
   }
  }
  if(!best)return 0;
  total+=best;
 }
 return total;
}
export function matchesSearch(query:string,fields:(string|undefined)[]):boolean{
 if(!query.trim())return true;
 const parsed=concepts(query);return parsed.length>0&&scoreFields(fields.map(value=>field(value,1)),parsed)>0;
}
const documentCache=new WeakMap<Card,{video?:VideoRecord;fields:Field[]}>();
function cardFields(card:Card,video?:VideoRecord):Field[]{
 const cached=documentCache.get(card);if(cached&&cached.video===video)return cached.fields;
 const quote=quotes.find(v=>v.id===card.id),clip=explainers.find(v=>v.id===card.id);
 const fields=[field(card.title,12),field([card.topic,card.language,...(card.keywords||[]),...(card.catalog?.tags||[])].filter(Boolean).join(" "),7),field([card.sourceName,card.catalog?.format==="repository"?card.source:undefined,video?.creator].filter(Boolean).join(" "),6),field([card.kind,card.level,card.catalog?.format].filter(Boolean).join(" "),3),field([permittedCardBody(card),card.explanation,card.back,card.takeaway,card.code,permittedCatalogExcerpt(card),card.catalog?.prompt,quote?.context,quote?.prompt,video?.description,clip?.description,...(clip?.transcript||[])].filter(Boolean).join(" "),2)];
 documentCache.set(card,{video,fields});return fields;
}
export function cardMatchesSearch(card:Card,query:string,videos:VideoRecord[]=[]):boolean{
 if(!query.trim())return true;
 const parsed=concepts(query);return parsed.length>0&&scoreFields(cardFields(card,videos.find(v=>v.id===card.id)),parsed)>0;
}
export function searchCards(cards:Card[],query:string,videos:VideoRecord[]=[]):Card[]{
 if(!query.trim())return cards; // Preserve the stable continuous-feed order.
 const parsed=concepts(query);if(!parsed.length)return [];
 const byId=new Map(videos.map(video=>[video.id,video]));
 return cards.map((card,index)=>({card,index,score:scoreFields(cardFields(card,byId.get(card.id)),parsed)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).map(item=>item.card);
}
export const searchExamples=["a11y","k8s","cybersecurity","sensor data","mobile","3D printing"];
