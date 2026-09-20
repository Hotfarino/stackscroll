"use client";
import {useEffect} from "react";
import {isDiagnosticCode,type DiagnosticCode} from "./diagnostic-codes";
const sent=new Map<DiagnosticCode,number>();
export async function reportDiagnostic(code:DiagnosticCode):Promise<boolean>{
 if(typeof window==="undefined"||!isDiagnosticCode(code))return false;
 const now=Date.now();if(code!=="self-test"&&now-(sent.get(code)||0)<60000)return false;
 sent.set(code,now);
 try{return (await fetch("/api/diagnostics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code}),signal:AbortSignal.timeout(5000),keepalive:true})).ok;}catch{return false;}
}
export function DiagnosticsObserver(){
 useEffect(()=>{
  const original=window.fetch;
  const observed:typeof fetch=async(input,init)=>{
   let code:DiagnosticCode|undefined;
   try{const url=new URL(input instanceof Request?input.url:String(input),location.href);
    if(url.origin===location.origin&&url.pathname.startsWith("/api/")&&url.pathname!=="/api/diagnostics")code=url.pathname==="/api/news"?"news-request":url.pathname==="/api/videos"?"video-request":"api-request";
   }catch{/* Let fetch validate its own input. */}
   try{const response=await original(input,init);if(code&&response.status>=500)void reportDiagnostic(code);return response;}
   catch(error){if(code&&!(error instanceof DOMException&&error.name==="AbortError"))void reportDiagnostic(code);throw error;}
  };
  const onError=(event:Event)=>{const target=event.target;void reportDiagnostic(target instanceof HTMLImageElement?"image-load":target instanceof HTMLMediaElement?"media-load":"browser-error");};
  const onRejection=()=>{void reportDiagnostic("promise-error");};
  window.fetch=observed;window.addEventListener("error",onError,true);window.addEventListener("unhandledrejection",onRejection);
  return()=>{if(window.fetch===observed)window.fetch=original;window.removeEventListener("error",onError,true);window.removeEventListener("unhandledrejection",onRejection);};
 },[]);
 return null;
}
