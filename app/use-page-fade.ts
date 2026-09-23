"use client";
import {useEffect,useState} from "react";
import {flushSync} from "react-dom";
import {createPageFade} from "./page-fade";

export function usePageFade(){
 const [fade]=useState(()=>createPageFade(
  ()=>document.getElementById("main-content"),
  ()=>document.hidden||document.documentElement.dataset.motion==="reduced"||matchMedia("(prefers-reduced-motion: reduce)").matches,
  change=>flushSync(change),
 ));
 useEffect(()=>{
  const media=matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>{if(media.matches||document.hidden||document.documentElement.dataset.motion==="reduced")fade.finish();};
  const observer=new MutationObserver(update);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-motion"]});
  media.addEventListener("change",update);document.addEventListener("visibilitychange",update);
  return()=>{fade.cancel();observer.disconnect();media.removeEventListener("change",update);document.removeEventListener("visibilitychange",update);};
 },[fade]);
 return fade;
}
