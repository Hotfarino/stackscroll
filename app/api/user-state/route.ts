import {z} from "zod";
import {json,readBody} from "../../video-server";
import {accountStateSchema} from "../../account-state";
import {supabase} from "../../supabase-server";

const fields={
 learning_state:accountStateSchema.shape.learning_state,
 feed_memory:accountStateSchema.shape.feed_memory,
 preferences:accountStateSchema.shape.preferences,
 video_playlist:accountStateSchema.shape.video_playlist,
} as const;
const updateSchema=z.object({field:z.enum(["learning_state","feed_memory","preferences","video_playlist"]),value:z.unknown()}).strict();
type Row={learning_state:unknown;feed_memory:unknown;preferences:unknown;video_playlist:unknown};
function user(request:Request){return request.headers.get("oai-authenticated-user-id");}

export async function GET(request:Request){
 const id=user(request);if(!id)return json({error:"Sign in to load your account data."},401);
 try{
  const response=await supabase(`/rest/v1/user_state?user_id=eq.${encodeURIComponent(id)}&select=learning_state,feed_memory,preferences,video_playlist&limit=1`);
  if(!response.ok)throw new Error(`Account state read failed (${response.status})`);
  const row=((await response.json()) as Row[])[0];
  if(!row)return json({state:null});
  const state:Partial<z.infer<typeof accountStateSchema>>={};
  for(const key of Object.keys(fields) as (keyof typeof fields)[]){
   const parsed=fields[key].safeParse(row[key]);
   if(parsed.success)Object.assign(state,{[key]:parsed.data});
  }
  return json({state});
 }catch(error){console.error("Account state read failed",error);return json({error:"Your account data could not be loaded."},503);}
}

export async function PUT(request:Request){
 const id=user(request);if(!id)return json({error:"Sign in to save your account data."},401);
 if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"This request must come from Stackscroll."},403);
 let input:z.infer<typeof updateSchema>;try{input=updateSchema.parse(await readBody(request,1_600_000));input={...input,value:fields[input.field].parse(input.value)};}catch{return json({error:"That account update is not valid."},400);}
 try{
  const response=await supabase("/rest/v1/user_state?on_conflict=user_id",{method:"POST",headers:{"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:id,[input.field]:input.value,updated_at:new Date().toISOString()})});
  if(!response.ok)throw new Error(`Account state write failed (${response.status})`);
  return json({ok:true});
 }catch(error){console.error("Account state write failed",error);return json({error:"Your account data could not be saved. Your device copy is unchanged."},503);}
}
