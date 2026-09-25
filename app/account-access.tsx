"use client";
import {useEffect,useState} from "react";
import {LogIn,LogOut} from "lucide-react";
import {Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle,SheetTrigger} from "@/components/ui/sheet";
import {Input} from "@/components/ui/input";
import {StackButton} from "./brand";

type Session={authenticated:boolean;email:string|null};
export function AccountAccess(){
 const [session,setSession]=useState<Session|null>(null),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{void fetch("/api/auth/session",{cache:"no-store"}).then(r=>r.json()).then(setSession).catch(()=>setSession({authenticated:false,email:null}));},[]);
 async function submit(path:"sign-in"|"sign-up"){setBusy(true);setMessage("");try{const response=await fetch(`/api/auth/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const data=await response.json() as {error?:string;confirmationRequired?:boolean};if(!response.ok)throw new Error(data.error||"Account request failed.");if(data.confirmationRequired){setMessage("Check your email to confirm the account, then sign in here.");return;}location.reload();}catch(error){setMessage(error instanceof Error?error.message:"Account request failed.");}finally{setBusy(false);}}
 async function signOut(){setBusy(true);await fetch("/api/auth/sign-out",{method:"POST"});location.reload();}
 return <Sheet><SheetTrigger asChild><button className="customize-trigger account-trigger" aria-label={session?.authenticated?"Open account":"Demo mode — sign in to sync"}>{session?.authenticated?<LogOut size={17}/>:<LogIn size={17}/>}<span>{session?.authenticated?"Account":"Demo"}</span></button></SheetTrigger><SheetContent className="customizer account-panel"><SheetHeader><SheetTitle>{session?.authenticated?"Your account":"Demo mode"}</SheetTitle><SheetDescription>{session?.authenticated?`Signed in${session.email?` as ${session.email}`:""}. Your private learning data can sync across devices.`:"The public feed works without an account. Sign in to sync saves, progress, preferences, and playlists."}</SheetDescription></SheetHeader><div className="customizer-body">{session?.authenticated?<StackButton tone="secondary" disabled={busy} onClick={()=>void signOut()}>Sign out</StackButton>:<><label>Email<Input type="email" autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)}/></label><label>Password<Input type="password" autoComplete="current-password" minLength={8} maxLength={128} value={password} onChange={event=>setPassword(event.target.value)}/></label><div className="account-actions"><StackButton disabled={busy} onClick={()=>void submit("sign-in")}>Sign in</StackButton><StackButton tone="secondary" disabled={busy} onClick={()=>void submit("sign-up")}>Create account</StackButton></div>{message&&<p role="status">{message}</p>}</>}</div></SheetContent></Sheet>;
}
