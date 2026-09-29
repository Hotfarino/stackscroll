"use client";

import {useEffect, useRef, useState} from "react";
import {ArrowLeft, ArrowRight, BookOpen, Check, Layers, X} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";
import {StackButton} from "./brand";
import "./stack-tutorial.css";

const preferenceKey = "stackscroll-tutorial-v1";
const visitKey = "stackscroll-tutorial-visit-v1";
const chapters = ["The idea", "Build layers", "Shape your mix", "Practice & recall", "Make it yours", "Your first session"];
const layers = [
  {name:"Networking", detail:"Understand how devices connect and how requests travel.", example:"Trace a DNS lookup", color:"cyan"},
  {name:"Cybersecurity", detail:"Connect those foundations to safer systems and better decisions.", example:"Recognize a phishing attempt", color:"purple"},
  {name:"Cloud", detail:"Apply the connections to the infrastructure behind real services.", example:"Explore cloud responsibility", color:"blue"},
];

export function StackTutorial({open,onOpenChange,onStacks,onPause}:{open:boolean;onOpenChange:(open:boolean)=>void;onStacks:()=>void;onPause:()=>void}) {
  const [step,setStep]=useState(0),[disabled,setDisabled]=useState(false),[storageNotice,setStorageNotice]=useState("");
  const [selected,setSelected]=useState(["Networking","Cybersecurity"]),[focus,setFocus]=useState("Networking"),[answer,setAnswer]=useState<number|null>(null);
  const heading=useRef<HTMLHeadingElement>(null),body=useRef<HTMLDivElement>(null),initial=useRef(true);
  useEffect(()=>{
    const timer=setTimeout(()=>{try {
      const preference=localStorage.getItem(preferenceKey);
      setDisabled(preference==="disabled");
      if(!preference&&!sessionStorage.getItem(visitKey)) {
        // Avoid interrupting an account form or another dialog opened on arrival.
        if(!document.querySelector('[role="dialog"], [role="alertdialog"]')) onOpenChange(true);
      }
    } catch {setStorageNotice("Tutorial preferences are available for this visit only.");}},1200);
    return()=>clearTimeout(timer);
  },[onOpenChange]);
  useEffect(()=>{if(open)onPause();},[open,onPause]);
  useEffect(()=>{
    if(initial.current){initial.current=false;return;}
    if(open){heading.current?.focus({preventScroll:true});body.current?.scrollTo({top:0,behavior:"instant"});}
  },[step,open]);
  function close(completed=false) {
    try {sessionStorage.setItem(visitKey,"seen");if(completed&&!disabled)localStorage.setItem(preferenceKey,"completed");}
    catch {setStorageNotice("Tutorial preferences are available for this visit only.");}
    onOpenChange(false);
  }
  function toggleDisabled(value:boolean) {
    setDisabled(value);
    try {if(value)localStorage.setItem(preferenceKey,"disabled");else localStorage.removeItem(preferenceKey);}
    catch {setStorageNotice("This browser could not save the setting. It applies for this visit only.");}
  }
  function toggleLayer(name:string) {
    setSelected(current=>current.includes(name)?current.filter(item=>item!==name):[...current,name]);
  }
  return <Dialog open={open} onOpenChange={value=>{if(!value)close();else onOpenChange(true);}}>
    <DialogContent className="stack-tutorial" showCloseButton={false} onOpenAutoFocus={event=>{event.preventDefault();setStep(0);heading.current?.focus();}} onCloseAutoFocus={event=>{event.preventDefault();const trigger=Array.from(document.querySelectorAll<HTMLButtonElement>('.tutorial-menu-link,.popout-trigger')).find(button=>button.getClientRects().length>0);trigger?.focus({preventScroll:true});}} onInteractOutside={event=>event.preventDefault()}>
      <header className="tutorial-header"><span><Layers size={20}/>THE STACKSCROLL GUIDE</span><button type="button" aria-label="Close tutorial" onClick={()=>close()}><X size={21}/></button></header>
      <nav className="tutorial-chapters" aria-label="Tutorial chapters">{chapters.map((chapter,index)=><button type="button" key={chapter} aria-label={`Chapter ${index+1}: ${chapter}`} aria-current={step===index?"step":undefined} onClick={()=>setStep(index)}><span>{index+1}</span><small>{chapter}</small></button>)}</nav>
      <div className="tutorial-body" ref={body}>
        <div className="tutorial-scene" key={step}>
          <span className="tutorial-kicker">{String(step+1).padStart(2,"0")} / {String(chapters.length).padStart(2,"0")} · {step===0?"ABOUT 3 MINUTES · AT YOUR PACE":chapters[step].toUpperCase()}</span>
          <DialogTitle ref={heading} tabIndex={-1} className="tutorial-title">{["Turn curiosity into a Stack.","A direction, built in layers.","Give your feed a purpose.","Explore it. Try it. Recall it.","From a sample to your own Stack.","Your first Stack starts here."][step]}</DialogTitle>
          <DialogDescription className="tutorial-description">{[
            "A Stack connects the topics you care about into a learning direction. Start with an interest, collect useful ideas, then put a concept into practice.",
            "Each layer is a topic. Together, layers bring different skills into one workspace. Try choosing the ingredients for a future cloud-security project.",
            "Topic emphasis gives some layers more attention in your mix. Your Stack provides direction while discovery still leaves room for other useful ideas.",
            "Reading is the starting point. Guided practice connects a scenario, an explanation, a question, the reasoning, and a recap.",
            "Your personal Stacks are private to your account. A draft lets you work on an idea; activation creates the version you will actually explore.",
            "Choose a small goal you can explain in one sentence. Your first session should help you find a direction and test one thing you learned.",
          ][step]}</DialogDescription>
          {step===0&&<><div className="tutorial-concept"><Layers size={32}/><strong>“I want to understand how to secure a cloud service.”</strong><p>Networking + Cybersecurity + Cloud</p><span>A goal connects the layers. The layers connect the content.</span></div><div className="tutorial-pair"><article><h3>Your personal Stack</h3><p>A saved combination of topics, emphasis, and selected content. You can customize it as your interests change.</p></article><article><h3>Guided practice</h3><p>A short authored learning sequence available from a Stack’s Practice tab. Progress and later recall are tracked separately.</p></article></div><p className="tutorial-note">The concept: move from scattered finds toward connected understanding—and eventually a project you can build. A Stack organizes the work; it does not certify mastery.</p></>}
          {step===1&&<><div className="tutorial-example-label">INTERACTIVE EXAMPLE · SELECT YOUR LAYERS</div><div className="tutorial-layers">{layers.map(layer=><button type="button" key={layer.name} data-tone={layer.color} aria-pressed={selected.includes(layer.name)} onClick={()=>toggleLayer(layer.name)}><span className="tutorial-layer-check">{selected.includes(layer.name)?<Check size={18}/>:<Layers size={18}/>}</span><span><strong>{layer.name}</strong><small>{layer.detail}</small></span></button>)}</div><p className="tutorial-feedback" role="status">{selected.length?`${selected.length} layers in your example: ${selected.join(" + ")}.`:"Select a topic to start your example Stack."}</p><p className="tutorial-note">This is a practice example. It does not create a Stack or change your account. In the real builder, give the Stack a name and purpose, choose topics, and preview its content.</p></>}
          {step===2&&<><div className="tutorial-example-label">TRY A DIFFERENT EMPHASIS</div><div className="tutorial-focus" role="group" aria-label="Example topic emphasis">{layers.map(layer=><button type="button" key={layer.name} aria-pressed={focus===layer.name} onClick={()=>setFocus(layer.name)}>{layer.name}</button>)}</div><div className="tutorial-preview" aria-live="polite"><span>Illustrative order · {focus} leads</span>{[...layers.filter(layer=>layer.name===focus),...layers.filter(layer=>layer.name!==focus)].map((layer,index)=><div key={layer.name}><span>{index+1}</span><strong>{layer.example}</strong><small>{layer.name}</small></div>)}</div><p>In Discover, select an active Stack for your mix. Apply saved topic changes or refresh when you’re ready; the feed keeps your current reading order stable.</p><p className="tutorial-note">Saving different cards in the same topic can suggest a Stack when personalization is on. Suggestions never create one automatically. Scrolling and watch time are not interest signals. Actual ordering also depends on available content, freshness, and your preferences.</p></>}
          {step===3&&<><ol className="tutorial-path"><li>Scenario</li><li>Concept</li><li>Question</li><li>Reasoning</li><li>Recap</li></ol><fieldset className="tutorial-question"><legend>Quick check: what does activating a Stack do?</legend>{["Publishes my Stack for everyone to follow.","Creates the saved version I can explore and use to shape my mix.","Marks every topic as mastered."].map((choice,index)=><button type="button" key={choice} aria-pressed={answer===index} onClick={()=>setAnswer(index)}>{answer===index&&<Check size={16}/>}<span>{choice}</span></button>)}</fieldset>{answer!==null&&<p className="tutorial-feedback" role="status">{answer===1?"Exactly. Your active version gives your learning a direction. Practice and recall are separate.":"Try again: activation creates your usable, private Stack version. It neither publishes it nor proves mastery."}</p>}<p>After a guided sequence, choose <strong>Review tomorrow</strong>. A different recall question becomes available in <strong>Lab</strong> after about 24 hours. You can resume unfinished practice; skipping a question is recorded as skipped.</p><p className="tutorial-note">This sample answer does not affect your stats. Some topics do not have an authored practice sequence yet.</p></>}
          {step===4&&<><ol className="tutorial-checklist"><li><strong>Join or sign in</strong><p>Use Join to create an account. Confirm your email if prompted. Personal Stack creation requires sign-in and an 18+ confirmation.</p></li><li><strong>Stacks → Build a Stack</strong><p>Name your goal, choose topic layers and emphasis, then review the content. Save a private draft if you want to return later.</p></li><li><strong>Choose “Use this Stack,” then explore</strong><p>Open My mix, Layer, Sources, and Practice. Customize when your direction changes; choose Update Stack to make saved draft edits active.</p></li></ol><div className="tutorial-callout"><BookOpen size={20}/><p><strong>Know what is saved.</strong> Account features can sync your learning data. Browsing without an account uses this device for supported local data. In Stacks → Discover, likes and follows are currently visit-only previews.</p></div><p className="tutorial-note">The sample Stack from this tutorial stays here. Build your real version in Stacks. Review the <a href="/privacy" target="_blank" rel="noopener noreferrer">tester privacy notice</a> before participating.</p></>}
          {step===5&&<><div className="tutorial-concept"><Layers size={30}/><strong>Find something. Connect it. Try it.</strong><p>Your Stack is the thread between those moments.</p></div><ol className="tutorial-checklist"><li><strong>Build one Stack around a real interest.</strong><p>Start with two or three layers. Open an idea and check its source.</p></li><li><strong>Save a useful card and try a practice sequence.</strong><p>Return to My Stacks after reloading and check that your account work is there.</p></li><li><strong>Tell your beta host what felt clear—or confusing.</strong><p>Share the screen or action, what you expected, what happened, and your device/browser. Leave passwords and personal details out of screenshots.</p></li></ol><p className="tutorial-note">Replay any time from Stackscroll guide in the sidebar, or Menu → Stackscroll guide on your phone. Tutorial settings apply to this browser. Future possibilities include shared learning paths and project-based Stacks; sharing and permanent follows are not part of this beta.</p></>}
        </div>
      </div>
      <footer className="tutorial-footer"><label className="tutorial-optout"><input type="checkbox" checked={disabled} onChange={event=>toggleDisabled(event.target.checked)}/>Don’t show automatically on this browser</label>{storageNotice&&<p role="status" className="tutorial-note">{storageNotice}</p>}<div className="tutorial-actions"><StackButton tone="quiet" onClick={()=>close()}>Skip for now</StackButton><div><StackButton tone="secondary" disabled={step===0} onClick={()=>setStep(value=>value-1)}><ArrowLeft size={16}/>Back</StackButton>{step<chapters.length-1?<StackButton onClick={()=>setStep(value=>value+1)}>Next<ArrowRight size={16}/></StackButton>:<StackButton onClick={()=>{close(true);onStacks();}}>Open my Stacks<ArrowRight size={16}/></StackButton>}</div></div></footer>
    </DialogContent>
  </Dialog>;
}
