"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {toast} from "sonner";
import {blankSession,transitionSession,type StoredSession,type TopicFeedback,type StackAction} from "./stacks";
const localKey="stackscroll-stack-progress-v1",feedbackKey="stackscroll-stack-feedback-v1";
function localData(){try{return {sessions:JSON.parse(localStorage.getItem(localKey)||"[]") as StoredSession[],feedback:JSON.parse(localStorage.getItem(feedbackKey)||"[]") as TopicFeedback[]};}catch{return {sessions:[],feedback:[]};}}
export function useStacks(){
 const [sessions,setSessions]=useState<StoredSession[]>([]);
 const [feedback,setFeedback]=useState<TopicFeedback[]>([]);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [busy,setBusy]=useState(false);
 const [storageMode,setStorageMode]=useState<"account"|"device">("account");
 const lock=useRef(false);
 const refresh=useCallback(async()=>{
  if(lock.current)return;
  lock.current=true;setBusy(true);
  try{const response=await fetch("/api/stacks",{cache:"no-store"});const result=await response.json() as {sessions:StoredSession[];feedback:TopicFeedback[];error?:string};if(!response.ok)throw new Error(result.error);setSessions(result.sessions);setFeedback(result.feedback);setStatus("ready");}
  catch{const local=localData();setSessions(local.sessions);setFeedback(local.feedback);setStorageMode("device");setStatus("ready");}finally{lock.current=false;setBusy(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 async function mutate(body:unknown){
  if(lock.current||status!=="ready")return false;
  if(storageMode==="device")return true;
  lock.current=true;setBusy(true);
  try{
   const response=await fetch("/api/stacks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json() as {session?:StoredSession|null;stackId?:string;error?:string};
   if(result.session)setSessions(current=>[...current.filter(item=>item.stackId!==result.session!.stackId),result.session!]);
   else if(response.status===409&&result.stackId)setSessions(current=>current.filter(item=>item.stackId!==result.stackId));
   if(!response.ok)throw new Error(result.error||"This change could not be saved. Try again.");
   return true;
  }catch(error){toast(error instanceof Error?error.message:"This change could not be saved. Try again.");return false;}
  finally{lock.current=false;setBusy(false);}
 }
 async function act(stackId:string,action:StackAction){
  if(storageMode==="device"){
   try{const previous=sessions.find(item=>item.stackId===stackId);const updated:StoredSession={stackId,data:transitionSession(previous?.data??blankSession(),action),revision:(previous?.revision??0)+1,updatedAt:Date.now()};const next=[...sessions.filter(item=>item.stackId!==stackId),updated];setSessions(next);localStorage.setItem(localKey,JSON.stringify(next));return true;}catch(error){toast(error instanceof Error?error.message:"That Stack change could not be saved.");return false;}
  }
  return mutate({operation:"session",stackId,revision:sessions.find(item=>item.stackId===stackId)?.revision??0,action});
 }
 async function tune(item:TopicFeedback){if(storageMode==="device"){const next=[...feedback.filter(old=>old.topic!==item.topic),item];setFeedback(next);localStorage.setItem(feedbackKey,JSON.stringify(next));toast("Feed preference saved on this device.");return true;}if(await mutate({operation:"feedback",feedback:item})){setFeedback(current=>[...current.filter(old=>old.topic!==item.topic),item]);toast("Feed preference saved.");return true;}return false;}
 async function resetFeedback(){if(storageMode==="device"){setFeedback([]);localStorage.removeItem(feedbackKey);return true;}if(await mutate({operation:"reset-feedback"})){setFeedback([]);return true;}return false;}
 async function clear(){if(storageMode==="device"){setSessions([]);setFeedback([]);localStorage.removeItem(localKey);localStorage.removeItem(feedbackKey);toast("Device Stack progress and feed feedback cleared.");return true;}if(await mutate({operation:"clear"})){setSessions([]);setFeedback([]);toast("Account stack progress, bookmarks, and feed feedback cleared.");return true;}return false;}
 return {sessions,feedback,status,busy,storageMode,refresh,act,tune,resetFeedback,clear};
}
