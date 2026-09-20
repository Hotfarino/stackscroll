import type { Card, Topic } from './content';
const clean=(value:unknown)=>typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,240):'';
function topic(title:string):Topic {return /agent|\bAI\b|LLM/i.test(title)?'Agentic AI':/network|DNS|TCP|router/i.test(title)?'Networking':/linux|server|database|cloud/i.test(title)?'Cloud':'Development';}
function dated(value:unknown,now:number){const time=typeof value==='string'?Date.parse(value):NaN;return Number.isFinite(time)&&time<=now?new Date(time).toISOString():undefined;}
export function hnCard(value:unknown,now=Date.now()):Card|undefined {
 if(!value||typeof value!=='object')return;const v=value as Record<string,unknown>,title=clean(v.title);
 if(v.type!=='story'||v.dead||v.deleted||!Number.isSafeInteger(v.id)||Number(v.id)<=0||typeof v.time!=='number'||!title)return;
 if(!/code|software|developer|agent|\bAI\b|LLM|linux|server|database|cloud|network|DNS|TCP|API|python|javascript|terminal|compiler|debug|open.source/i.test(title)||/casino|gambling|crypto|\bgame\b/i.test(title))return;
 const time=v.time*1000;if(!Number.isFinite(time)||time>now||time<0)return;
 return {id:`hn-${v.id}`,kind:'news',topic:topic(title),level:'Intermediate',title,body:'Community-submitted project. Open the discussion to inspect the original project, documentation, and feedback. Inclusion is not an endorsement or an independent test.',source:`https://news.ycombinator.com/item?id=${v.id}`,sourceName:'Hacker News · Community discovery',date:new Date(time).toISOString()};
}
export function paperCards(value:unknown,now=Date.now()):Card[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,30).flatMap(v=>{const p=v?.paper;if(!p||typeof p.id!=='string'||!/^\d{4}\.\d{4,5}(v\d+)?$/.test(p.id))return [];const title=clean(p.title),date=dated(p.publishedAt,now);if(!title||!date)return [];
 return [{id:`hf-paper-${p.id}`,kind:'news',topic:/agent|LLM/i.test(title)?'Agentic AI':'Machine learning',level:'Advanced',title,body:'Research preview. Inspect the paper’s methods, evaluation setup, and limitations. A listing does not establish independent replication or production readiness.',source:`https://huggingface.co/papers/${p.id}`,sourceName:'Hugging Face · Research preview',date} as Card];});
}
async function json(url:string,fetcher:typeof fetch){
 const r=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(4000),headers:{Accept:'application/json'}});
 if(!r.ok)throw new Error('Discovery unavailable');const reader=r.body?.getReader();if(!reader)throw new Error('Empty discovery');let size=0,text='';const decoder=new TextDecoder();
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2000000){await reader.cancel();throw new Error('Discovery too large');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}return JSON.parse(text);
}
export async function discoverHN(fetcher:typeof fetch=fetch){
 const ids=await json('https://hacker-news.firebaseio.com/v0/showstories.json',fetcher);if(!Array.isArray(ids))throw new Error('Invalid discovery');
 const selected=[...new Set(ids.filter(id=>Number.isSafeInteger(id)&&id>0))].slice(0,48);
 if(!selected.length)throw new Error('Empty discovery');
 const results=await Promise.allSettled(selected.map(id=>json(`https://hacker-news.firebaseio.com/v0/item/${id}.json`,fetcher)));
 if(results.every(r=>r.status==='rejected'))throw new Error('Items unavailable');
 return {items:results.flatMap(r=>r.status==='fulfilled'?[hnCard(r.value)].filter((c):c is Card=>!!c):[]),partial:results.some(r=>r.status==='rejected')};
}
export async function discoverPapers(fetcher:typeof fetch=fetch){const items=paperCards(await json('https://huggingface.co/api/daily_papers?limit=30',fetcher));if(!items.length)throw new Error('No dated papers');return {items,partial:false};}
