"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowRight, ArrowLeft, Check, CheckCircle2, ExternalLink, Lightbulb, Terminal, Clock3, Network, Laptop, Database} from "lucide-react";
import {Bookmark} from "./reference-bookmark";
import {RadioGroup,RadioGroupItem} from "@/components/ui/radio-group";
import {Progress} from "@/components/ui/progress";
import {StackButton} from "./brand";
import {NetworkDiagram,WorkflowDiagram,SubnetDiagram} from "./learning-card";
import {type LearningStack,type StackSession,type StackAction} from "./stacks";
import type {Card} from "./content";

function Reference({card}:{card:Card}){return <div className="stack-reference"><span>Source linked · independent review pending</span><a href={card.source} target="_blank" rel="noopener noreferrer">{card.sourceName}<ExternalLink size={14}/></a></div>;}
function Answers({card,value,onChange,disabled}:{card:Card;value:string;onChange:(value:string)=>void;disabled:boolean}){return <RadioGroup aria-label={card.title} value={value} onValueChange={onChange} disabled={disabled} className="quiz-options">{card.options?.map((option,index)=><label key={index} className={`quiz-option ${value===String(index)?"selected":""}`} htmlFor={`${card.id}-${index}`}><RadioGroupItem className="answer-radio" id={`${card.id}-${index}`} value={String(index)}/><span className="option-letter">{String.fromCharCode(65+index)}</span><span>{option}</span></label>)}</RadioGroup>;}
export function StackSessionView({stack,session,busy,onAction,onExit,onRelated}:{stack:LearningStack;session:StackSession;busy:boolean;onAction:(action:StackAction)=>Promise<boolean>;onExit:()=>void;onRelated:()=>void}){
 const [selected,setSelected]=useState(session.answer===null?"":String(session.answer));
 const heading=useRef<HTMLHeadingElement>(null),first=useRef(true);
 useEffect(()=>{if(first.current){first.current=false;return;}heading.current?.focus();},[session.step]);
 useEffect(()=>{if(session.step===0&&session.seen.length===0&&session.answer===null)setSelected("");},[session.step,session.seen.length,session.answer]);
 const step=session.step;
 const act=(action:StackAction)=>{void onAction(action);};
 return <section className="guided-stack" aria-label={stack.title}>
  <div className="stack-context"><span>{stack.topic} <b>/</b> {stack.level}</span><span><Clock3 size={14}/>{stack.minutes} min estimate</span></div>
  <div className="stack-step-heading"><span>STEP {step+1} / {stack.steps.length}</span><span>{stack.steps[step]}</span></div>
  <Progress className="stack-progress" value={(step+1)/stack.steps.length*100} aria-label={`Step ${step+1} of ${stack.steps.length}: ${stack.steps[step]}`}/>
  <div className="stack-page">
   <h2 ref={heading} tabIndex={-1}>{step===0?stack.title:step===1?stack.concept.title:step===2?stack.question.title:step===3?session.answer===null?"Here’s how to reason through it.":session.answer===stack.question.answer?"That’s the useful distinction.":"Let’s unpack that choice.":"A good place to pause."}</h2>
   {step===0&&<><p className="scenario-copy">{stack.scenario}</p><div className="objective-box"><span>BY THE END OF THIS STACK</span><p>{stack.objective}</p></div><p className="stack-prerequisite">Before you start: {stack.prerequisite}.</p><p className="stack-note">One explanation, one question, then a clear finish.</p></>}
   {step===1&&<><p className="scenario-copy">{stack.concept.body||stack.concept.back}</p>
    {stack.id==="dns-diagnosis"&&<div className="dns-flow" aria-label="Client queries a DNS resolver. The resolver returns a cached record or performs a lookup."><div><Laptop/><strong>Client</strong><small>Requests a name</small></div><ArrowRight aria-hidden="true"/><div><Network/><strong>Resolver</strong><small>Cache or lookup</small></div><ArrowRight aria-hidden="true"/><div><Database/><strong>Record answer</strong><small>Address, if found</small></div></div>}
    {stack.concept.visual==="network"&&<NetworkDiagram/>}{stack.concept.visual==="workflow"&&<WorkflowDiagram/>}{stack.concept.visual==="subnet"&&<SubnetDiagram/>}
    {stack.concept.code&&<div className="code-panel"><div><Terminal size={14}/>{stack.concept.language}</div><pre><code>{stack.concept.code}</code></pre></div>}
    {stack.concept.takeaway&&<div className="takeaway"><Lightbulb size={18}/><p>{stack.concept.takeaway}</p></div>}<Reference card={stack.concept}/></>}
   {step===2&&<><p className="scenario-copy">{stack.question.body}</p><Answers card={stack.question} value={session.answer===null?selected:String(session.answer)} onChange={setSelected} disabled={busy||session.answer!==null}/><p className="stack-note">Original practice question · not an official exam item.</p></>}
   {step===3&&<><div className={`answer-explanation ${session.answer===stack.question.answer?"right":"wrong"}`} role="status"><strong>{session.answer===null?"Question skipped":session.answer===stack.question.answer?<><CheckCircle2 size={18}/>Correct answer</>:"Answer reviewed"}</strong>{session.answer!==null&&<p>Your answer: {stack.question.options?.[session.answer]}</p>}<p><b>Best answer:</b> {stack.question.options?.[stack.question.answer??0]}</p></div><p className="scenario-copy">{stack.question.explanation}</p><Reference card={stack.question}/></>}
   {step===4&&<><p className="scenario-copy">{stack.objective}</p><dl className="session-results"><div><dt>Explanation</dt><dd>{session.seen.includes(1)?"Read":"Not read"}</dd></div><div><dt>Practice</dt><dd>{session.answer===null?"Skipped":session.answer===stack.question.answer?"1 / 1 correct":"0 / 1 correct"}</dd></div><div><dt>Later recall</dt><dd>{session.recallAt?session.recallAnswer===stack.recall.answer?"Recalled correctly":"Attempted":session.reviewDue?"Scheduled":"Not attempted"}</dd></div></dl><p className="stack-note">Finishing records your activity. Later recall checks what stayed with you.</p><div className="finish-review"><div><strong>Try a different question later.</strong><p>{session.reviewDue?`Review available ${new Date(session.reviewDue).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}. Find it in Lab.`:"Add an optional recall question to Lab for tomorrow."}</p></div><StackButton tone="secondary" disabled={busy||!!session.reviewDue} onClick={()=>act({type:"review"})}>{session.reviewDue?<><Check size={16}/>Scheduled</>:"Review tomorrow"}</StackButton></div></>}
  </div>
  <footer className="stack-actions"><div>{step>0&&step<4&&<StackButton tone="quiet" disabled={busy} onClick={()=>act({type:"back"})}><ArrowLeft size={16}/>Back</StackButton>}<button className="icon-button" disabled={busy} aria-label={session.saved?"Unsave stack":"Save stack"} aria-pressed={session.saved} onClick={()=>act({type:"save"})}><Bookmark size={19} fill={session.saved?"currentColor":"none"}/></button></div><div>
   {step===2&&session.answer===null?<><StackButton tone="quiet" disabled={busy} onClick={()=>act({type:"next"})}>Skip question</StackButton><StackButton tone="primary" disabled={busy||selected===""} onClick={()=>act({type:"answer",answer:Number(selected)})}>Check answer<ArrowRight size={16}/></StackButton></>:step===4?<StackButton tone="primary" onClick={onExit}>Done for now<Check size={16}/></StackButton>:<StackButton tone="primary" disabled={busy} onClick={()=>act({type:"next"})}>{step===0?"Start stack":step===1?"Try the question":step===2?"View reasoning":"Finish stack"}<ArrowRight size={16}/></StackButton>}
  </div></footer>
  {step===4&&<div className="optional-next"><span>WHEN YOU’RE READY</span><button onClick={onRelated}>Explore a related stack<ArrowRight size={16}/></button><button disabled={busy} onClick={()=>{setSelected("");act({type:"restart"});}}>Restart this stack</button></div>}
 </section>;
}
export function StackRecall({stack,session,busy,onAction}:{stack:LearningStack;session:StackSession;busy:boolean;onAction:(action:StackAction)=>Promise<boolean>}){
 const [selected,setSelected]=useState("");const answered=session.reviewDue===null&&session.recallAnswer!==null;
 return <article className="learning-card recall-exercise"><div className="card-main"><span className="eyebrow">LATER RECALL / {stack.topic.toUpperCase()}</span><h2>{stack.recall.title}</h2><p className="card-body">{stack.recall.body}</p><Answers card={stack.recall} value={answered?String(session.recallAnswer):selected} onChange={setSelected} disabled={answered||busy}/>{answered?<div role="status" className={`answer-explanation ${session.recallAnswer===stack.recall.answer?"right":"wrong"}`}><strong>{session.recallAnswer===stack.recall.answer?"Recalled correctly":"Recall attempted"}</strong><p>Best answer: {stack.recall.options?.[stack.recall.answer??0]}</p><p>{stack.recall.explanation}</p></div>:<StackButton tone="primary" disabled={busy||!selected} onClick={()=>void onAction({type:"recall",answer:Number(selected)})}>Check recall<ArrowRight size={16}/></StackButton>}</div><Reference card={stack.recall}/></article>;
}
