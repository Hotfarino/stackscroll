"use client";
import {useEffect,useRef,useState} from "react";
import {BarChart3,Camera,UserRound,X} from "lucide-react";
import {Sheet,SheetTrigger,SheetContent,SheetHeader,SheetTitle,SheetDescription} from "@/components/ui/sheet";
import {Input} from "@/components/ui/input";
import {StackButton} from "./brand";
import {clearStackscrollDeviceData} from "./device-storage";

export type ProfileStats={saved:number;completed:number;accuracy:number|null;stacks:number;recalls:number};
type Profile={name:string;headline:string;bio:string;photo:string};
const key="stackscroll-profile-v1";
const empty:Profile={name:"",headline:"",bio:"",photo:""};
export function readProfile(raw:string|null):Profile{
 try{const value=raw?JSON.parse(raw):{};return {name:typeof value.name==="string"?value.name.slice(0,60):"",headline:typeof value.headline==="string"?value.headline.slice(0,80):"",bio:typeof value.bio==="string"?value.bio.slice(0,240):"",photo:typeof value.photo==="string"&&value.photo.startsWith("data:image/")?value.photo:""};}catch{return empty;}
}
async function resizePhoto(file:File){
 if(!file.type.startsWith("image/")||file.size>8_000_000)throw new Error("Choose an image smaller than 8 MB.");
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("That image could not be read."));image.src=url;});
  const side=Math.min(image.naturalWidth,image.naturalHeight),canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;
  const context=canvas.getContext("2d");if(!context)throw new Error("Photo processing is unavailable.");
  context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);
  return canvas.toDataURL("image/jpeg",.82);
 }finally{URL.revokeObjectURL(url);}
}
export function ProfileControl({stats,storageMode}:{stats:ProfileStats;storageMode:"account"|"device"}){
 const [profile,setProfile]=useState<Profile>(empty),[ready,setReady]=useState(false),[owner,setOwner]=useState(false),[message,setMessage]=useState("");
 const [confirmClear,setConfirmClear]=useState(false),[clearing,setClearing]=useState(false);
 const file=useRef<HTMLInputElement|null>(null);
 useEffect(()=>{let active=true;void fetch("/api/auth/session",{cache:"no-store"}).then(async response=>{const session=await response.json() as {owner?:boolean};if(active)setOwner(Boolean(session.owner));}).catch(()=>{});return()=>{active=false;};},[]);
 useEffect(()=>{let active=true;const local=readProfile(localStorage.getItem(key));setProfile(local);if(storageMode!=="account"){setReady(true);return()=>{active=false;};}fetch("/api/profile",{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json() as {profile:Profile|null};if(active&&data.profile){setProfile(data.profile);localStorage.setItem(key,JSON.stringify(data.profile));}}).catch(()=>{if(active)setMessage("Using the profile saved on this device.");}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[storageMode]);
 async function save(){try{localStorage.setItem(key,JSON.stringify(profile));if(storageMode!=="account"){setMessage("Profile saved on this device.");return;}setMessage("Saving securely…");const response=await fetch("/api/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...profile,removePhoto:!profile.photo})});const data=await response.json() as {profile?:Profile;error?:string};if(!response.ok||!data.profile)throw new Error(data.error||"Profile save failed");setProfile(data.profile);localStorage.setItem(key,JSON.stringify(data.profile));setMessage("Profile saved to your private account.");}catch(error){setMessage(error instanceof Error?error.message:"Profile could not be saved.");}}
 async function photo(next:File|undefined){if(!next)return;try{const resized=await resizePhoto(next);setProfile(current=>({...current,photo:resized}));setMessage("Photo ready. Save your profile to keep it.");}catch(error){setMessage(error instanceof Error?error.message:"That photo could not be used.");}}
 async function clearDevice(){setClearing(true);try{await clearStackscrollDeviceData();location.reload();}catch{setMessage("Some device data could not be cleared. Use your browser's website-data settings.");setClearing(false);}}
 const label=profile.name.trim()||"Your profile";
 return <Sheet><SheetTrigger asChild><button className="profile-trigger" aria-label="Open your profile">{ready&&profile.photo?<img src={profile.photo} alt=""/>:<UserRound size={20}/>}<span>{profile.name.trim()||"Profile"}</span></button></SheetTrigger>
  <SheetContent className="profile-panel" aria-describedby="profile-description">
   <SheetHeader><span className="profile-kicker">STACKSCROLL / YOUR SIGNAL</span><SheetTitle>{label}</SheetTitle><SheetDescription id="profile-description">Your profile and photo stay private and sync when account storage is available.</SheetDescription></SheetHeader>
   <div className="profile-body">
    <section className="profile-identity"><div className="profile-photo">{profile.photo?<img src={profile.photo} alt="Profile preview"/>:<UserRound aria-hidden="true"/>}<button aria-label="Remove profile photo" hidden={!profile.photo} onClick={()=>setProfile(current=>({...current,photo:""}))}><X size={14}/></button></div><input ref={file} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>void photo(event.target.files?.[0])}/><StackButton tone="secondary" onClick={()=>file.current?.click()}><Camera size={16}/>Add photo</StackButton></section>
    <section className="profile-fields"><label>Display name<Input value={profile.name} maxLength={60} onChange={event=>setProfile(current=>({...current,name:event.target.value}))} placeholder="Your name"/></label><label>Focus or role<Input value={profile.headline} maxLength={80} onChange={event=>setProfile(current=>({...current,headline:event.target.value}))} placeholder="Example: IT support → cloud"/></label><label>About<textarea value={profile.bio} maxLength={240} rows={4} onChange={event=>setProfile(current=>({...current,bio:event.target.value}))} placeholder="What are you building toward?"/></label></section>
    <section className="profile-stats" aria-label="Learning stats"><div><strong>{stats.saved}</strong><span>Saved</span></div><div><strong>{stats.completed}</strong><span>Cards completed</span></div><div><strong>{stats.accuracy===null?"—":`${stats.accuracy}%`}</strong><span>Quiz accuracy</span></div><div><strong>{stats.stacks}</strong><span>Stacks finished</span></div><div><strong>{stats.recalls}</strong><span>Recalls completed</span></div></section>
    <p className="profile-storage"><strong>{storageMode==="account"?"Private account storage":"Offline test storage"}</strong><br/>{storageMode==="account"?"Profile details and photo sync through the authenticated Stackscroll API.":"Profile and Stack progress remain on this browser and do not sync to another device."}</p>
    {owner&&<section className="profile-owner-tools"><span className="profile-kicker">OWNER TOOLS</span><a href="/metrics"><BarChart3 size={18}/><span><strong>Development metrics</strong><small>Usage, reliability, and creator approvals</small></span></a></section>}
    <div className="profile-save"><StackButton onClick={()=>void save()}>Save profile</StackButton><span role="status" aria-live="polite">{message}</span></div>
    <section className="profile-danger"><strong>Private-device controls</strong><p>Remove this profile photo, offline progress, preferences, playlists, and downloaded app cache from this browser. Account-backed records are not deleted.</p>{confirmClear?<div><StackButton tone="secondary" disabled={clearing} onClick={()=>void clearDevice()}>{clearing?"Clearing…":"Confirm clear"}</StackButton><button onClick={()=>setConfirmClear(false)} disabled={clearing}>Cancel</button></div>:<button onClick={()=>setConfirmClear(true)}>Clear this device</button>}</section>
   </div>
  </SheetContent>
 </Sheet>;
}
