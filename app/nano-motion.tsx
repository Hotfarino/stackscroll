"use client";

import {useEffect} from "react";
import {swarmFrames,type NanoPoint} from "./nano-choreography";

function outlinePoints(target:Element,count:number):NanoPoint[]{
 const shapes=Array.from(target.querySelectorAll("svg path,svg line,svg circle,svg polyline,svg rect"));
 const points:NanoPoint[]=[];
 // Sample the existing vectors, never clone content, controls, or external imagery.
 for(let i=0;i<count&&shapes.length;i++){
  const shape=shapes[i%shapes.length];
  if(!(shape instanceof SVGGeometryElement))continue;
  try{
   const matrix=shape.getScreenCTM();
   if(!matrix)continue;
   const point=shape.getPointAtLength(shape.getTotalLength()*((i*.618034)%1)).matrixTransform(matrix);
   if(Number.isFinite(point.x)&&Number.isFinite(point.y))points.push({x:point.x,y:point.y});
  }catch{/* Hidden or unsupported geometry uses the control outline below. */}
 }
 return points;
}

/** Decorative, bounded motion: never delays an action or remounts feed content. */
export function NanoMotion() {
 useEffect(()=>{
  const preference=matchMedia("(prefers-reduced-motion: reduce)");
  const contrast=matchMedia("(forced-colors: active)");
  const running=new Set<Animation>();
  const layers=new Set<HTMLElement>();
  let lastTap=0;
  let source:NanoPoint|null=null;
  const disabled=()=>preference.matches||contrast.matches||document.documentElement.dataset.motion==="reduced"||document.hidden;
  function clear(){running.forEach(a=>a.cancel());running.clear();layers.forEach(e=>e.remove());layers.clear();}
  function animate(element:Element,frames:Keyframe[],duration:number,easing="cubic-bezier(.4,0,.2,1)"){
   const animation=element.animate(frames,{duration,easing});
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
   const count=screen?80:56,duration=screen?1300:1000;
   const outline=screen?[]:outlinePoints(target,count);
   const origin=screen&&source&&performance.now()-lastTap<700?source:{x:left+width/2,y:top+Math.min(height/2,180)};
   for(let i=0;i<count;i++){
    const particle=document.createElement("i");
    // Irregular bands, not an evenly spaced dot grid. Screen streams settle into
    // the new surface; control swarms return to their original vector outline.
    const angle=i*2.39996;
    const end=screen?{x:left+width*(.08+.84*((i*.618034)%1)),y:top+Math.min(height,420)*(.1+.8*((i*.381966)%1))}
     :outline[i%outline.length]??{x:left+width/2+Math.cos(angle)*width*.4,y:top+height/2+Math.sin(angle)*height*.35};
    const start=screen?{x:origin.x+Math.cos(angle)*8,y:origin.y+Math.sin(angle)*8}:end;
    particle.style.left=`${start.x}px`;particle.style.top=`${start.y}px`;
    layer.appendChild(particle);
    animate(particle,swarmFrames(start,end,i,screen),duration,"linear");
   }
   const material=screen?target:(target.querySelector("svg")||target);
   const finish=animate(material,[{opacity:1},{offset:.25,opacity:screen?.86:.18},{offset:.58,opacity:screen?.9:.28},{offset:.88,opacity:1},{opacity:1}],duration);
   finish.finished.then(()=>{layer.remove();layers.delete(layer);},()=>{layer.remove();layers.delete(layer);});
  }
  function click(event:MouseEvent){
   const target=event.target instanceof Element?event.target.closest("button,[role='tab'],[role='menuitem'],[role='switch'],[role='checkbox']"):null;
   if(!target||target.matches(":disabled,[aria-disabled='true']")||performance.now()-lastTap<90)return;
   lastTap=performance.now();
   const rect=target.getBoundingClientRect();source={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
   transfer(target);
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
