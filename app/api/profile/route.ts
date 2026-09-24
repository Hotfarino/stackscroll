import {z} from "zod";
import {json,readBody} from "../../video-server";
import {privateAvatarUrl,stableUserPath,supabase} from "../../supabase-server";

const profileSchema=z.object({
 name:z.string().trim().max(80),headline:z.string().trim().max(120),bio:z.string().trim().max(500),
 photo:z.string().max(700_000).refine(value=>!value||/^data:image\/(jpeg|png|webp);base64,/.test(value),"Unsupported photo"),
 removePhoto:z.boolean().optional(),
}).strict();
type Row={display_name:string;headline:string;bio:string;avatar_path:string|null};

function user(request:Request){return request.headers.get("oai-authenticated-user-id");}
async function readRow(id:string){
 const response=await supabase(`/rest/v1/profiles?user_id=eq.${encodeURIComponent(id)}&select=display_name,headline,bio,avatar_path&limit=1`);
 if(!response.ok)throw new Error(`Profile read failed (${response.status})`);
 return ((await response.json()) as Row[])[0]??null;
}
async function removeAvatar(path:string|null){if(path)await supabase(`/storage/v1/object/avatars/${path}`,{method:"DELETE"});}

export async function GET(request:Request){
 const id=user(request);if(!id)return json({error:"Sign in to load your profile."},401);
 try{const row=await readRow(id);return json({profile:row?{name:row.display_name,headline:row.headline,bio:row.bio,photo:row.avatar_path?await privateAvatarUrl(row.avatar_path):""}:null});}
 catch(error){console.error("Profile read failed",error);return json({error:"Your profile could not be loaded."},503);}
}

export async function PUT(request:Request){
 const id=user(request);if(!id)return json({error:"Sign in to save your profile."},401);
 if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"This request must come from Stackscroll."},403);
 let input:z.infer<typeof profileSchema>;try{input=profileSchema.parse(await readBody(request,750_000));}catch{return json({error:"That profile update is not valid."},400);}
 try{
  const current=await readRow(id);let avatarPath=current?.avatar_path??null;
  if(input.removePhoto){await removeAvatar(avatarPath);avatarPath=null;}
  if(input.photo){
   const match=input.photo.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);if(!match)throw new Error("Invalid photo");
   const bytes=Uint8Array.from(atob(match[2]),character=>character.charCodeAt(0));if(bytes.byteLength>600_000)throw new Error("Photo too large");
   const folder=await stableUserPath(id),extension=match[1]==="jpeg"?"jpg":match[1],next=`${folder}/avatar.${extension}`;
   if(avatarPath&&avatarPath!==next)await removeAvatar(avatarPath);
   const upload=await supabase(`/storage/v1/object/avatars/${next}`,{method:"POST",headers:{"Content-Type":`image/${match[1]}`,"x-upsert":"true"},body:bytes});
   if(!upload.ok)throw new Error(`Avatar upload failed (${upload.status})`);avatarPath=next;
  }
  const response=await supabase("/rest/v1/profiles?on_conflict=user_id",{method:"POST",headers:{"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:id,display_name:input.name,headline:input.headline,bio:input.bio,avatar_path:avatarPath,updated_at:new Date().toISOString()})});
  if(!response.ok)throw new Error(`Profile write failed (${response.status})`);
  return json({profile:{name:input.name,headline:input.headline,bio:input.bio,photo:avatarPath?await privateAvatarUrl(avatarPath):""}});
 }catch(error){console.error("Profile write failed",error);return json({error:"Your profile could not be saved. Your device copy is unchanged."},503);}
}
