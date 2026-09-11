"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {toast} from "sonner";
import type {StoredSession,TopicFeedback,StackAction} from "./stacks";
export function useStacks(){
 const [sessions,setSessions]=useState<StoredSession[]>([]);
 const [feedback,setFeedback]=useState<TopicFeedback[]>([]);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [busy,setBusy]=useState(false);
 const lock=useRef(false);
 const refresh=useCallback(async()=>{
  if(lock.current)return;
  lock.current=true;setBusy(true);
  try{const response=await fetch("/api/stacks",{cache:"no-store"});const result=await response.json() as {sessions:StoredSession[];feedback:TopicFeedback[];error?:string};if(!response.ok)throw new Error(result.error);setSessions(result.sessions);setFeedback(result.feedback);setStatus("ready");}
  catch{setStatus("error");}finally{lock.current=false;setBusy(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 async function mutate(body:unknown){
  if(lock.current||status!=="ready")return false;
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
 async function act(stackId:string,action:StackAction){return mutate({operation:"session",stackId,revision:sessions.find(item=>item.stackId===stackId)?.revision??0,action});}
 async function tune(item:TopicFeedback){if(await mutate({operation:"feedback",feedback:item})){setFeedback(current=>[...current.filter(old=>old.topic!==item.topic),item]);toast("Feed preference saved.");return true;}return false;}
 async function resetFeedback(){if(await mutate({operation:"reset-feedback"})){setFeedback([]);return true;}return false;}
 async function clear(){if(await mutate({operation:"clear"})){setSessions([]);setFeedback([]);toast("Account stack progress, bookmarks, and feed feedback cleared.");return true;}return false;}
 return {sessions,feedback,status,busy,refresh,act,tune,resetFeedback,clear};
}
