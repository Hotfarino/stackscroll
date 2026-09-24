import {env} from "cloudflare:workers";

type SupabaseEnv={SUPABASE_URL?:string;SUPABASE_SECRET_KEY?:string};

function config(){
 const runtime=env as unknown as SupabaseEnv;
 const url=runtime.SUPABASE_URL?.replace(/\/$/,"");
 const key=runtime.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new Error("Supabase is not configured");
 return {url,key};
}

export async function supabase(path:string,init:RequestInit={}){
 const {url,key}=config(),headers=new Headers(init.headers);
 headers.set("apikey",key);headers.set("Authorization",`Bearer ${key}`);
 return fetch(`${url}${path}`,{...init,headers});
}

export async function privateAvatarUrl(path:string){
 const response=await supabase(`/storage/v1/object/sign/avatars/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expiresIn:3600})});
 if(!response.ok)throw new Error(`Avatar signing failed (${response.status})`);
 const data=await response.json() as {signedURL?:string};
 if(!data.signedURL)throw new Error("Avatar signing failed");
 return data.signedURL;
}

export async function stableUserPath(userId:string){
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(userId));
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
}
