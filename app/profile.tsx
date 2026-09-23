"use client";
import {useEffect,useRef,useState} from "react";
import {Camera,UserRound,X} from "lucide-react";
import {Sheet,SheetTrigger,SheetContent,SheetHeader,SheetTitle,SheetDescription} from "@/components/ui/sheet";
import {Input} from "@/components/ui/input";
import {StackButton} from "./brand";

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
 const [profile,setProfile]=useState<Profile>(empty),[ready,setReady]=useState(false),[message,setMessage]=useState("");
 const file=useRef<HTMLInputElement|null>(null);
 useEffect(()=>{setProfile(readProfile(localStorage.getItem(key)));setReady(true);},[]);
 function save(){try{localStorage.setItem(key,JSON.stringify(profile));setMessage("Profile saved on this device.");}catch{setMessage("Profile could not be saved on this device.");}}
 async function photo(next:File|undefined){if(!next)return;try{const resized=await resizePhoto(next);setProfile(current=>({...current,photo:resized}));setMessage("Photo ready. Save your profile to keep it.");}catch(error){setMessage(error instanceof Error?error.message:"That photo could not be used.");}}
 const label=profile.name.trim()||"Your profile";
 return <Sheet><SheetTrigger asChild><button className="profile-trigger" aria-label="Open your profile">{ready&&profile.photo?<img src={profile.photo} alt=""/>:<UserRound size={20}/>}<span>{profile.name.trim()||"Profile"}</span></button></SheetTrigger>
  <SheetContent className="profile-panel" aria-describedby="profile-description">
   <SheetHeader><span className="profile-kicker">STACKSCROLL / YOUR SIGNAL</span><SheetTitle>{label}</SheetTitle><SheetDescription id="profile-description">Your profile, photo, and test stats stay on this device.</SheetDescription></SheetHeader>
   <div className="profile-body">
    <section className="profile-identity"><div className="profile-photo">{profile.photo?<img src={profile.photo} alt="Profile preview"/>:<UserRound aria-hidden="true"/>}<button aria-label="Remove profile photo" hidden={!profile.photo} onClick={()=>setProfile(current=>({...current,photo:""}))}><X size={14}/></button></div><input ref={file} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>void photo(event.target.files?.[0])}/><StackButton tone="secondary" onClick={()=>file.current?.click()}><Camera size={16}/>Add photo</StackButton></section>
    <section className="profile-fields"><label>Display name<Input value={profile.name} maxLength={60} onChange={event=>setProfile(current=>({...current,name:event.target.value}))} placeholder="Your name"/></label><label>Focus or role<Input value={profile.headline} maxLength={80} onChange={event=>setProfile(current=>({...current,headline:event.target.value}))} placeholder="Example: IT support → cloud"/></label><label>About<textarea value={profile.bio} maxLength={240} rows={4} onChange={event=>setProfile(current=>({...current,bio:event.target.value}))} placeholder="What are you building toward?"/></label></section>
    <section className="profile-stats" aria-label="Learning stats"><div><strong>{stats.saved}</strong><span>Saved</span></div><div><strong>{stats.completed}</strong><span>Cards completed</span></div><div><strong>{stats.accuracy===null?"—":`${stats.accuracy}%`}</strong><span>Quiz accuracy</span></div><div><strong>{stats.stacks}</strong><span>Stacks finished</span></div><div><strong>{stats.recalls}</strong><span>Recalls completed</span></div></section>
    <p className="profile-storage"><strong>{storageMode==="account"?"Account Stack storage":"Offline test storage"}</strong><br/>{storageMode==="account"?"Stack progress is connected. Profile details remain on this device.":"Profile and Stack progress remain on this browser and do not sync to another device."}</p>
    <div className="profile-save"><StackButton onClick={save}>Save profile</StackButton><span role="status" aria-live="polite">{message}</span></div>
   </div>
  </SheetContent>
 </Sheet>;
}
