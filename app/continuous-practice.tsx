"use client";
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,CheckCircle2,RotateCcw} from 'lucide-react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Checkbox} from '@/components/ui/checkbox';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {StackButton} from './brand';
import type {ExamModel} from './use-exam-attempts';
import type {BankQuestion} from './certification-bank';
import {parseLoopProgress,makePracticeRound,exactAnswer,recordPractice,type LoopQuestion,type LoopProgress} from './practice-loop';

type Payload={version:string;storageScope:string;tracks:{id:string;name:string;code:string;questions:BankQuestion[]}[]};
export function ContinuousPractice({model}:{model:ExamModel}){
 const [data,setData]=useState<Payload|null>(null),[exam,setExam]=useState('a-core-1');
 const [progress,setProgress]=useState<LoopProgress>({}),[round,setRound]=useState<LoopQuestion[]>([]);
 const [index,setIndex]=useState(0),[selected,setSelected]=useState<number[]>([]),[checked,setChecked]=useState(false);
 const [outcomes,setOutcomes]=useState<boolean[]>([]),[finished,setFinished]=useState(false),[adult,setAdult]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[storageOk,setStorageOk]=useState(true),[reset,setReset]=useState(false);
 const writable=useRef(true),key=useRef(''),lock=useRef(false),graded=useRef(false),advancing=useRef(false),seed=useRef(Date.now()),previousId=useRef('');
 const title=useRef<HTMLHeadingElement>(null),controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const bank:LoopQuestion[]=data?.tracks.filter(t=>exam==='all'||t.id===exam).flatMap(t=>t.questions.map(q=>({...q,examId:t.id,examName:t.name,examCode:t.code})))||[];
 const question=round[index];
 const due=bank.filter(q=>progress[q.id]?.due<=Date.now()).length;
 function persist(next:LoopProgress){setProgress(next);if(!writable.current)return;try{localStorage.setItem(key.current,JSON.stringify(next));}catch{writable.current=false;setStorageOk(false);}}
 async function load(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{
   if(!model.eligible&&!await model.attest(adult))return;
   controller.current=new AbortController();
   const response=await fetch('/api/practice-loop',{cache:'no-store',signal:AbortSignal.any([controller.current.signal,AbortSignal.timeout(12000)])});
   const result=await response.json() as Payload & {error?:string};
   if(!response.ok||!Array.isArray(result.tracks)||!result.tracks.length||!result.version||!/^[a-f0-9]{64}$/.test(result.storageScope))throw new Error(result.error||'Could not load the question pool.');
   key.current=`stackscroll-practice-loop-v1:${result.storageScope}:${result.version}`;
   try{const ids=new Set(result.tracks.flatMap(t=>t.questions.map(q=>q.id)));setProgress(parseLoopProgress(localStorage.getItem(key.current),ids));}catch{writable.current=false;setStorageOk(false);}
   setData(result);
  }catch(e){if(!controller.current?.signal.aborted)setError(e instanceof Error?e.message:'Could not load practice.');}
  finally{lock.current=false;setBusy(false);}
 }
 function begin(){
  seed.current++;setRound(makePracticeRound(bank,progress,seed.current,Date.now(),previousId.current));setIndex(0);setSelected([]);setChecked(false);setFinished(false);setOutcomes([]);graded.current=false;
 }
 function check(){
  if(!question||graded.current||selected.length!==question.selectCount)return;
  graded.current=true;const correct=exactAnswer(question,selected);
  persist({...progress,[question.id]:recordPractice(progress[question.id],correct)});
  setOutcomes(current=>[...current,correct]);setChecked(true);previousId.current=question.id;
 }
 function next(){
  if(!checked||advancing.current)return;advancing.current=true;
  if(index+1===round.length){setFinished(true);return;}
  setIndex(i=>i+1);setSelected([]);setChecked(false);graded.current=false;
 }
 useEffect(()=>{advancing.current=false;if(round.length){title.current?.focus({preventScroll:true});title.current?.scrollIntoView({block:'nearest',behavior:'instant'});}},[round,index,finished]);
 const active=round.length>0&&!finished;
 return <section className="continuous-practice">
  <div className="exam-catalog-heading"><div><span className="eyebrow">COMPTIA · CONTINUAL PRACTICE</span><h2>Keep the concepts fresh.</h2></div></div>
  <p className="exam-scope">Short rounds you can repeat. Missed questions get priority in the next round; unseen questions follow. Answer choices shuffle each time.</p>
  {!data?<>
   {!model.eligible&&<label className="exam-age"><Checkbox checked={adult} disabled={busy||model.busy} onCheckedChange={v=>setAdult(v===true)}/><span>I confirm that I’m 18 or older.</span></label>}
   <StackButton tone="primary" disabled={busy||model.busy||model.status!=='ready'||(!model.eligible&&!adult)} onClick={()=>void load()}>{busy?'Loading…':'Open CompTIA practice'}<ArrowRight size={17}/></StackButton>
   {(error||model.error)&&<p role="alert" className="exam-error">{error||model.error}</p>}{model.status==='error'&&<StackButton tone="secondary" disabled={model.busy} onClick={()=>void model.refresh()}>Retry loading Lab</StackButton>}
  </>:<>
   <div className="loop-controls"><Select value={exam} disabled={active} onValueChange={value=>{setExam(value);setRound([]);setFinished(false);}}><SelectTrigger aria-label="Choose CompTIA exam for continual practice"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All CompTIA · mixed</SelectItem>{data.tracks.map(t=><SelectItem key={t.id} value={t.id}>{t.name} · {t.code}</SelectItem>)}</SelectContent></Select><p>{bank.length} original questions in this pool · {due} due for review</p></div>
   {!storageOk&&<p role="status" className="exam-error">History is session-only because device storage is unavailable or unreadable. Existing saved history has been preserved.</p>}
   {!round.length?<StackButton tone="primary" onClick={begin}>Start {Math.min(8,bank.length)}-question round<ArrowRight size={17}/></StackButton>:finished?<div className="loop-summary">
    <h3 ref={title} tabIndex={-1}>Round complete: {outcomes.filter(Boolean).length} / {round.length} correct</h3>
    <p>{outcomes.some(v=>!v)?'Your missed questions will lead the next round.':'Ready for another round whenever you are.'} Repeated-question scores describe this practice, not exam readiness.</p>
    <StackButton tone="primary" onClick={begin}>Next round<RotateCcw size={17}/></StackButton><StackButton tone="quiet" onClick={()=>{setRound([]);setFinished(false);}}>Finish for now</StackButton>
   </div>:question&&<article className="loop-question">
    <div className="exam-question-meta"><strong>{question.examName} · {question.examCode}</strong><span>Question {index+1} of {round.length}</span></div>
    <div className="exam-question-heading"><span>{question.domain}</span><h3 ref={title} tabIndex={-1}>{question.prompt}</h3><p>Select {question.selectCount===1?'one answer':`${question.selectCount} answers`}.</p></div>
    {question.selectCount===1?<RadioGroup className="exam-options" aria-label="Answer choices" disabled={checked} value={selected.length?String(selected[0]):''} onValueChange={v=>setSelected([Number(v)])}>{question.options.map((option,i)=><label key={`${question.id}-${i}`} className="exam-option" data-selected={selected.includes(i)}><RadioGroupItem value={String(i)}/><span className="exam-option-letter">{String.fromCharCode(65+i)}</span><span>{option}</span></label>)}</RadioGroup>:<div className="exam-options" role="group" aria-label={`Select ${question.selectCount} answers`}>{question.options.map((option,i)=><label key={`${question.id}-${i}`} className="exam-option" data-selected={selected.includes(i)}><Checkbox checked={selected.includes(i)} disabled={checked||(!selected.includes(i)&&selected.length>=question.selectCount)} onCheckedChange={v=>setSelected(old=>v?[...old,i]:old.filter(n=>n!==i))}/><span className="exam-option-letter">{String.fromCharCode(65+i)}</span><span>{option}</span></label>)}</div>}
    {checked&&<div className="loop-explanation" role="status"><strong>{outcomes.at(-1)?'Correct.':'Not quite. Review the reasoning.'}</strong><p><strong>Correct answer: </strong>{question.correct.map(i=>question.options[i]).join('; ')}</p><p>{question.explanation}</p>{question.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>)}<p>Missed items return in a later round. Correct items are scheduled for review in 1, 3, 7, then 14 days; you can practice earlier.</p></div>}
    <div className="loop-actions">{checked?<StackButton tone="primary" onClick={next}>{index+1===round.length?'Finish round':'Next question'}<ArrowRight size={17}/></StackButton>:<StackButton tone="primary" disabled={selected.length!==question.selectCount} onClick={check}>Check answer<CheckCircle2 size={17}/></StackButton>}<StackButton tone="quiet" onClick={()=>{setRound([]);setFinished(false);}}>Stop round</StackButton></div>
   </article>}
   <p className="exam-integrity">This mode recycles the same original question pool with explanations and source links. Independent factual review is pending. History stays in this browser for this account and question-set version; it is separate from exam attempts, feed activity, and later-recall scores. Unanswered questions are not scored.</p>
   <StackButton tone="quiet" onClick={()=>setReset(true)}>Reset loop history</StackButton>
   <AlertDialog open={reset} onOpenChange={setReset}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset continual practice history?</AlertDialogTitle><AlertDialogDescription>This clears this question version’s results and review schedule on this device. Exam attempts and Stacks are kept.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>{writable.current=true;setStorageOk(true);persist({});setRound([]);setFinished(false);setReset(false);}}>Reset history</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>}
 </section>;
}
