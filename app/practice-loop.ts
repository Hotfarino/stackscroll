import type { BankQuestion } from './certification-bank';
export type LoopQuestion=BankQuestion & {examId:string;examName:string;examCode:string};
export type LoopRecord={attempts:number;correct:number;streak:number;last:number;due:number;missed:boolean};
export type LoopProgress=Record<string,LoopRecord>;
export const DAY=86400000;
export function parseLoopProgress(raw:string|null,ids:Set<string>):LoopProgress{
 if(raw===null)return {};
 if(raw.length>200000)throw new Error('Practice history too large');
 const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid practice history');
 const result:LoopProgress={};
 for(const [id,v] of Object.entries(data)){
  if(!ids.has(id)||['__proto__','constructor','prototype'].includes(id))continue;
  const r=v as LoopRecord;if(!r||typeof r!=='object'||!['attempts','correct','streak','last','due'].every(k=>Number.isSafeInteger(r[k as keyof LoopRecord])&&Number(r[k as keyof LoopRecord])>=0)||r.correct>r.attempts||r.streak>r.correct||typeof r.missed!=='boolean')throw new Error('Invalid practice entry');
  result[id]=r;
 }
 return result;
}
function hash(value:string){let n=2166136261;for(const c of value){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}n^=n>>>16;return n>>>0;}
export function shuffleQuestion(question:LoopQuestion,seed:number):LoopQuestion{
 const order=question.options.map((_,i)=>i).sort((a,b)=>hash(`${seed}:${question.id}:option:${a}`)-hash(`${seed}:${question.id}:option:${b}`));
 return {...question,options:order.map(i=>question.options[i]),correct:order.flatMap((original,i)=>question.correct.includes(original)?[i]:[])};
}
export function makePracticeRound(bank:LoopQuestion[],progress:LoopProgress,seed:number,now=Date.now(),previousId=''):LoopQuestion[]{
 const priority=(q:LoopQuestion)=>{const r=progress[q.id];return !r?1:r.missed?0:r.due<=now?2:3;};
 const pool=[...new Map(bank.map(q=>[q.id,q])).values()].sort((a,b)=>priority(a)-priority(b)||hash(`${seed}:${a.id}`)-hash(`${seed}:${b.id}`)).slice(0,8);
 if(pool.length>1&&pool[0].id===previousId)[pool[0],pool[1]]=[pool[1],pool[0]];
 return pool.map(q=>shuffleQuestion(q,seed));
}
export function exactAnswer(question:LoopQuestion,selected:number[]){return selected.length===question.correct.length&&new Set(selected).size===selected.length&&question.correct.every(i=>selected.includes(i));}
export function recordPractice(previous:LoopRecord|undefined,correct:boolean,now=Date.now()):LoopRecord{
 // Intervals are a simple scheduling rule, not a validated measure of mastery.
 const earlyCorrect=correct&&previous&&!previous.missed&&previous.due>now;
 const streak=correct?(earlyCorrect?previous.streak:(previous?.streak||0)+1):0;
 const interval=correct?[1,3,7,14][Math.min(streak-1,3)]*DAY:10*60000;
 return {attempts:(previous?.attempts||0)+1,correct:(previous?.correct||0)+(correct?1:0),streak,last:now,due:earlyCorrect?previous.due:now+interval,missed:!correct};
}
