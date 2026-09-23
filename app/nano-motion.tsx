"use client";

import {useEffect} from "react";

/** Decorative, bounded motion: never delays an action or remounts feed content. */
export function NanoMotion() {
 useEffect(()=>{
  const preference=matchMedia("(prefers-reduced-motion: reduce)");
  const contrast=matchMedia("(forced-colors: active)");
  const running=new Set<Animation>();
  const layers=new Set<HTMLElement>();
  let lastTap=0;
  const disabled=()=>preference.matches||contrast.matches||document.documentElement.dataset.motion==="reduced"||document.hidden;
  function clear(){running.forEach(a=>a.cancel());running.clear();layers.forEach(e=>e.remove());layers.clear();}
  function animate(element:Element,frames:Keyframe[],duration:number){
   const animation=element.animate(frames,{duration,easing:"cubic-bezier(.4,0,.2,1)"});
   running.add(animation);
   animation.finished.then(()=>running.delete(animation),()=>running.delete(animation));
   return animation;
  }
  function transfer(target:Element,screen=false){
   if(disabled()||typeof target.animate!=="function")return;
   // One burst at a time also bounds work during rapid tapping.
   clear();
   const rect=target.getBoundingClientRect();
   const left=Math.max(0,rect.left),top=Math.max(0,rect.top);
   const width=Math.min(rect.right,innerWidth)-left,height=Math.min(rect.bottom,innerHeight)-top;
   if(width<=0||height<=0)return;
   const layer=document.createElement("div");
   layer.className="nano-transfer-layer";layer.setAttribute("aria-hidden","true");
   document.body.appendChild(layer);layers.add(layer);
   const count=screen?48:24,duration=screen?1300:1000;
   for(let i=0;i<count;i++){
    const particle=document.createElement("i");
    const x=left+width*((i%8+.5)/8),y=top+height*((Math.floor(i/8)+.5)/(count/8));
    const angle=i*2.39996,spread=screen?52:25;
    particle.style.left=`${x}px`;particle.style.top=`${y}px`;
    layer.appendChild(particle);
    const dispersed=`translate(${Math.cos(angle)*spread}px,${Math.sin(angle)*spread}px) scale(1)`;
    animate(particle,[{opacity:0,transform:"translate(0,0) scale(.4)"},{offset:.22,opacity:.85},{offset:.42,opacity:.75,transform:dispersed},{offset:.58,opacity:.75,transform:dispersed},{opacity:0,transform:"translate(0,0) scale(.25)"}],duration);
   }
   const material=screen?target:(target.querySelector("svg")||target);
   const finish=animate(material,[{opacity:1},{offset:.25,opacity:screen?.72:.25},{offset:.65,opacity:.8},{opacity:1}],duration);
   finish.finished.then(()=>{layer.remove();layers.delete(layer);},()=>{layer.remove();layers.delete(layer);});
  }
  function click(event:MouseEvent){
   const target=event.target instanceof Element?event.target.closest("button,[role='tab'],[role='menuitem'],[role='switch'],[role='checkbox']"):null;
   if(!target||target.matches(":disabled,[aria-disabled='true']")||performance.now()-lastTap<90)return;
   lastTap=performance.now();transfer(target);
  }
  const observer=new MutationObserver(records=>{
   if(disabled()){clear();return;}
   const change=records.find(r=>r.attributeName==="data-nano-view");
   if(change)transfer(change.target as Element,true);
  });
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:["data-nano-view","data-motion"]});
  document.addEventListener("click",click,true);
  document.addEventListener("visibilitychange",clear);
  window.addEventListener("resize",clear);
  window.addEventListener("scroll",clear,true);
  preference.addEventListener("change",clear);contrast.addEventListener("change",clear);
  return()=>{clear();observer.disconnect();document.removeEventListener("click",click,true);document.removeEventListener("visibilitychange",clear);window.removeEventListener("resize",clear);window.removeEventListener("scroll",clear,true);preference.removeEventListener("change",clear);contrast.removeEventListener("change",clear);};
 },[]);
 return null;
}
