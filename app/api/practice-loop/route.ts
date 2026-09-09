import { database, json } from '../../video-server';
import { adultPolicy } from '../../personal-stacks';
import { examBanks } from '../../certification-bank';
import { examTracks, examSetVersion } from '../../certification-catalog';
export async function GET(request:Request){
 const user=request.headers.get('oai-authenticated-user-id');
 if(!user)return json({error:'Sign in to open continuous practice.'},401);
 try{
  const eligible=await database().prepare("SELECT user_id FROM stack_accounts WHERE user_id = ? AND age_policy = ? AND age_method = 'self_attestation'").bind(user,adultPolicy).first();
  if(!eligible)return json({error:'Confirm you are 18 or older before starting practice.'},403);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`stackscroll-practice-loop:${user}`));
  const storageScope=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return json({version:examSetVersion,storageScope,tracks:examTracks.filter(t=>t.provider==='CompTIA').map(t=>({id:t.id,name:t.name,code:t.code,questions:examBanks[t.id]}))});
 }catch{return json({error:'Continuous practice could not load. Try again.'},503);}
}
