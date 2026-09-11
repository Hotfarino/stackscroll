import type {Card} from "./content";
import {quotes,explainers} from "./media-content";
import type {VideoRecord} from "./video-catalog";
export function matchesSearch(query:string,fields:(string|undefined)[]):boolean{
 const normalize=(s:string)=>s.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[’‘]/g,"'");
 const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
 const text=normalize(fields.filter(Boolean).join(" "));
 return terms.every(term=>text.includes(term));
}
export function cardMatchesSearch(card:Card,query:string,videos:VideoRecord[]=[]):boolean{
 const quote=quotes.find(v=>v.id===card.id),clip=explainers.find(v=>v.id===card.id),video=videos.find(v=>v.id===card.id);
 return matchesSearch(query,[card.title,card.topic,card.kind,card.level,card.body,card.explanation,card.back,card.takeaway,card.code,card.language,card.sourceName,card.catalog?.excerpt,card.catalog?.prompt,...(card.catalog?.tags||[]),card.kind==="humor"?"memes funny tech humor":"",card.catalog?.format,quote?.context,quote?.prompt,video?.description,video?.creator,clip?.description,...(clip?.transcript||[])]);
}
