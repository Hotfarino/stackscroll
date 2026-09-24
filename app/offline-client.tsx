"use client";
import {useEffect} from "react";
export function OfflineClient(){
 useEffect(()=>{
  if(!("serviceWorker" in navigator)||location.protocol!=="https:"||sessionStorage.getItem("stackscroll-offline-disabled")==="1")return;
  let active=true;
  navigator.serviceWorker.register("/sw.js").then(async registration=>{
   if(!active)return;
   await navigator.serviceWorker.ready;
   const urls=[location.pathname,...Array.from(document.querySelectorAll<HTMLLinkElement|HTMLScriptElement|HTMLImageElement>("link[rel='stylesheet'],script[src],img[src]")).map(element=>element instanceof HTMLLinkElement?element.href:element.src).filter(Boolean)];
   (registration.active||navigator.serviceWorker.controller)?.postMessage({type:"CACHE_PAGE",urls});
  }).catch(()=>{});
  return()=>{active=false;};
 },[]);
 return null;
}
