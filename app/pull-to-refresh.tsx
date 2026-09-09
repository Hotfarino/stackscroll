"use client";
import {useEffect,useRef,useState,type RefObject} from "react";
import {RotateCcw} from "lucide-react";

export function PullToRefresh({target,enabled,busy,onRefresh}:{target:RefObject<HTMLDivElement|null>;enabled:boolean;busy:boolean;onRefresh:()=>Promise<void>}) {
 const [distance,setDistance]=useState(0),[top,setTop]=useState(76);
 const callback=useRef(onRefresh);callback.current=onRefresh;
 const working=useRef(busy);working.current=busy;
 useEffect(()=>{
  const element=target.current;
  if(!enabled||!element)return;
  document.documentElement.dataset.pullRefresh="true";
  let start:{x:number;y:number}|null=null,pull=0,frame=0;
  const show=(value:number)=>{pull=value;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setDistance(value));};
  const cancel=()=>{start=null;show(0);};
  function begin(event:TouchEvent){
   cancel();
   if(working.current||event.touches.length!==1||window.scrollY>1||document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'))return;
   const node=event.target instanceof Element?event.target:null;
   if(!node||node.closest('button,a,input,textarea,select,video,iframe,[contenteditable],[role="tablist"]'))return;
   for(let parent=node;parent&&parent!==element;parent=parent.parentElement!){
    if(parent.scrollHeight>parent.clientHeight+1&&/(auto|scroll)/.test(getComputedStyle(parent).overflowY))return;
   }
   const point=event.touches[0];start={x:point.clientX,y:point.clientY};
   setTop(element?.querySelector(".topbar")?.getBoundingClientRect().bottom??76);
  }
  function move(event:TouchEvent){
   if(!start)return;
   if(event.touches.length!==1||working.current||window.scrollY>1){cancel();return;}
   const point=event.touches[0],dy=point.clientY-start.y,dx=Math.abs(point.clientX-start.x);
   if(dy<=0||dx>Math.max(12,dy)){cancel();return;}
   if(dy<8)return;
   if(!event.cancelable){cancel();return;}
   event.preventDefault();show(Math.min(100,dy*.5));
  }
  function end(){const refresh=start!==null&&pull>=64&&!working.current;cancel();if(refresh){working.current=true;void callback.current().finally(()=>{working.current=false;});}}
  element.addEventListener("touchstart",begin,{passive:true});
  element.addEventListener("touchmove",move,{passive:false});
  element.addEventListener("touchend",end,{passive:true});
  element.addEventListener("touchcancel",cancel,{passive:true});
  return()=>{cancelAnimationFrame(frame);delete document.documentElement.dataset.pullRefresh;element.removeEventListener("touchstart",begin);element.removeEventListener("touchmove",move);element.removeEventListener("touchend",end);element.removeEventListener("touchcancel",cancel);setDistance(0);};
 },[enabled,target]);
 if(!enabled||(!distance&&!busy))return null;
 return <div className="pull-refresh-indicator" role="status" style={{top:top+8,transform:`translate(-50%, ${busy?12:Math.min(distance,72)-20}px)`}}><RotateCcw size={19} className={busy?"refresh-turn":""} style={busy?undefined:{transform:`rotate(${-distance*3}deg)`}}/><span>{busy?"Refreshing…":distance>=64?"Release to refresh":"Pull down to refresh"}</span></div>;
}
