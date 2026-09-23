"use client";
import {useEffect} from "react";
import {nanoPhase,type NanoPoint} from "./nano-choreography";
import {controlSnapshot} from "./nano-snapshot";

/** One canvas / one clock. Page effects do not cancel the control's reassembly. */
export function NanoMotion(){
 useEffect(()=>{
  const preference=matchMedia("(prefers-reduced-motion: reduce)"),contrast=matchMedia("(forced-colors: active)");
  let canvas:HTMLCanvasElement|null=null,ctx:CanvasRenderingContext2D|null=null,frame=0,lastTap=0;
  let source:NanoPoint|null=null;
  type Burst={kind:"control"|"screen";start:number;duration:number;draw:(t:number)=>void;restore:()=>void};
  let bursts:Burst[]=[];
  const disabled=()=>preference.matches||contrast.matches||document.documentElement.dataset.motion==="reduced"||document.hidden;
  function clear(){cancelAnimationFrame(frame);frame=0;bursts.forEach(b=>b.restore());bursts=[];canvas?.remove();canvas=null;ctx=null;}
  function removeKind(kind:Burst["kind"]){bursts=bursts.filter(b=>{if(b.kind!==kind)return true;b.restore();return false;});}
  function tick(now:number){
   frame=0;
   if(disabled()){clear();return;}
   ctx?.clearRect(0,0,innerWidth,innerHeight);
   bursts=bursts.filter(b=>{
    const t=Math.min(1,(now-b.start)/b.duration);
    if(t>=1){b.restore();return false;}
    try{b.draw(t);return true;}catch{b.restore();return false;}
   });
   if(bursts.length)frame=requestAnimationFrame(tick);else clear();
  }
  function ready(){
   if(disabled())return false;
   if(!canvas){
    canvas=document.createElement("canvas");canvas.className="nano-transfer-layer";canvas.setAttribute("aria-hidden","true");
    // Bound backing-store memory on high-DPI phones.
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.ceil(innerWidth*ratio);canvas.height=Math.ceil(innerHeight*ratio);
    ctx=canvas.getContext("2d");if(!ctx){canvas=null;return false;}
    ctx.scale(ratio,ratio);document.body.appendChild(canvas);
   }
   return true;
  }
  function add(burst:Burst){removeKind(burst.kind);bursts.push(burst);if(!frame)frame=requestAnimationFrame(tick);}
  function control(target:Element){
   removeKind("control");
   const box=target.getBoundingClientRect();
   const material=box.width>360||box.height>110?target.querySelector("svg"):target;
   if(!material||!ready()||typeof material.animate!=="function")return;
   let snapshot:ReturnType<typeof controlSnapshot>;
   try{snapshot=controlSnapshot(material);}catch{snapshot=null;}
   if(!snapshot){if(!bursts.length)clear();return;}
   const {bitmap,tiles,rect}=snapshot;
   // Hide the actual material completely while its fragments are dispersed.
   const opacity=material.animate([{opacity:1},{offset:.08,opacity:0},{offset:.92,opacity:0},{opacity:1}],{duration:1000,easing:"linear"});
   add({kind:"control",start:performance.now(),duration:1000,restore:()=>opacity.cancel(),draw:t=>{
    if(!ctx)return;
    const p=nanoPhase(t),c=Math.cos(p.turn),s=Math.sin(p.turn);
    ctx.globalAlpha=p.cover;
    for(const tile of tiles){
     const x=rect.left+tile.x+(tile.vx*c-tile.vy*s)*p.scatter;
     const y=rect.top+tile.y+(tile.vx*s+tile.vy*c)*p.scatter;
     ctx.drawImage(bitmap,tile.x,tile.y,tile.w,tile.h,x,y,tile.w,tile.h);
    }
    ctx.globalAlpha=1;
   }});
  }
  function screen(target:Element){
   if(!ready())return;
   const rect=target.getBoundingClientRect(),left=Math.max(0,rect.left),top=Math.max(0,rect.top);
   const width=Math.min(innerWidth,rect.right)-left,height=Math.min(innerHeight,rect.bottom)-top;
   if(width<=0||height<=0){if(!bursts.length)clear();return;}
   const origin=source&&performance.now()-lastTap<700?source:{x:left+width/2,y:top+30};
   const dots=Array.from({length:72},(_,i)=>({x:left+width*((i*.618034)%1),y:top+Math.min(height,420)*((i*.381966)%1),bend:(i%7-3)*14}));
   // Page content stays fully opaque and mounted throughout.
   add({kind:"screen",start:performance.now(),duration:1300,restore:()=>{},draw:t=>{
    if(!ctx)return;
    const p=nanoPhase(t),arc=Math.sin(t*Math.PI);
    ctx.globalAlpha=p.cover*.65;ctx.fillStyle="#8bd5e3";
    for(const dot of dots)ctx.fillRect(origin.x+(dot.x-origin.x)*p.travel+dot.bend*arc,origin.y+(dot.y-origin.y)*p.travel,2,2);
    ctx.globalAlpha=1;
   }});
  }
  function click(event:MouseEvent){
   if(disabled())return;
   const target=event.target instanceof Element?event.target.closest("button,[role='tab'],[role='menuitem'],[role='switch'],[role='checkbox']"):null;
   if(!target||target.matches(":disabled,[aria-disabled='true']")||performance.now()-lastTap<90)return;
   lastTap=performance.now();const rect=target.getBoundingClientRect();source={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
   control(target);
  }
  const observer=new MutationObserver(records=>{
   if(disabled()){clear();return;}
   const change=records.find(r=>r.attributeName==="data-nano-view");if(change)screen(change.target as Element);
  });
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:["data-nano-view","data-motion"]});
  const scrollKey=(event:KeyboardEvent)=>{if(["PageDown","PageUp","Home","End","ArrowDown","ArrowUp"].includes(event.key))clear();};
  document.addEventListener("click",click,true);document.addEventListener("visibilitychange",clear);
  window.addEventListener("resize",clear);window.addEventListener("wheel",clear,{passive:true});window.addEventListener("touchmove",clear,{passive:true});window.addEventListener("keydown",scrollKey);
  preference.addEventListener("change",clear);contrast.addEventListener("change",clear);
  return()=>{clear();observer.disconnect();document.removeEventListener("click",click,true);document.removeEventListener("visibilitychange",clear);window.removeEventListener("resize",clear);window.removeEventListener("wheel",clear);window.removeEventListener("touchmove",clear);window.removeEventListener("keydown",scrollKey);preference.removeEventListener("change",clear);contrast.removeEventListener("change",clear);};
 },[]);
 return null;
}
