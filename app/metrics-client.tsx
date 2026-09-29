"use client";
import {useEffect} from "react";
import type {MetricCode,MetricSurface} from "./metric-codes";

const sent=new Map<MetricCode,number>();
function surface():MetricSurface{const path=location.pathname;return path==="/"?"feed":path.startsWith("/metrics")||path.startsWith("/diagnostics")||path.startsWith("/content-review")?"admin":"policy";}
export async function reportMetric(code:MetricCode){
 if(typeof window==="undefined")return false;
 const now=Date.now(),last=sent.get(code)||0;if(now-last<1000)return false;sent.set(code,now);
 try{return (await fetch("/api/metrics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,surface:surface()}),keepalive:true,signal:AbortSignal.timeout(4000)})).ok;}catch{return false;}
}
function classify(target:Element):MetricCode|undefined{
 const control=target.closest("button,a");if(!control)return;
 const text=(control.textContent||"").trim().toLowerCase(),label=(control.getAttribute("aria-label")||"").toLowerCase();
 if(control.matches("a[href^='http']"))return "external-source-open";
 if(label.startsWith("save ")||label.startsWith("unsave ")||control.classList.contains("save-button"))return "card-save";
 if(control.classList.contains("thumbnail-action")||text.includes("load youtube player"))return "video-load";
 if(text.includes("refresh feed"))return "feed-refresh";
 if(text.includes("show 6 more")||text.includes("show more cards"))return "load-more";
 if(text==="filters")return "filter-open";
 if(text.includes("paste social post"))return "social-project-open";
 if(label.includes("profile")||label.includes("playlist")||label.includes("privacy controls"))return "account-open";
 if(control.closest(".stack-session,.stack-builder,.stack-card,.recall-exercise"))return "stack-action";
 if(control.closest("nav")||control.closest("[role='tablist']"))return "navigation";
}
export function MetricsObserver(){
 useEffect(()=>{
  void reportMetric("page-view");
  try{const key="stackscroll-metric-session",now=Date.now(),last=Number(sessionStorage.getItem(key)||0);if(now-last>30*60000){sessionStorage.setItem(key,String(now));void reportMetric("session-start");}}catch{/* Session counting is optional. */}
  let searchTimer=0,half=false,end=false;
  const click=(event:MouseEvent)=>{if(event.target instanceof Element){const code=classify(event.target);if(code)void reportMetric(code);}};
  const submit=(event:SubmitEvent)=>{if(event.target instanceof Element&&event.target.closest(".social-import-dialog"))void reportMetric("social-project-submit");};
  const input=(event:Event)=>{if(event.target instanceof HTMLInputElement&&event.target.id==="content-search"&&event.target.value.trim()){clearTimeout(searchTimer);searchTimer=window.setTimeout(()=>void reportMetric("search-use"),900);}};
  const scroll=()=>{const total=document.documentElement.scrollHeight-innerHeight;if(total<=0)return;const depth=scrollY/total;if(depth>=.5&&!half){half=true;void reportMetric("scroll-half");}if(depth>=.9&&!end){end=true;void reportMetric("scroll-end");}};
  document.addEventListener("click",click,true);document.addEventListener("submit",submit,true);document.addEventListener("input",input,true);window.addEventListener("scroll",scroll,{passive:true});
  return()=>{clearTimeout(searchTimer);document.removeEventListener("click",click,true);document.removeEventListener("submit",submit,true);document.removeEventListener("input",input,true);window.removeEventListener("scroll",scroll);};
 },[]);return null;
}
