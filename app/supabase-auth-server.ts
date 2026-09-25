import {env} from "cloudflare:workers";

type AuthEnv={SUPABASE_URL?:string;SUPABASE_SECRET_KEY?:string};
export type AuthSession={access_token:string;refresh_token:string;expires_in:number;user?:{id?:string;email?:string}};

function config(){const runtime=env as unknown as AuthEnv;const url=runtime.SUPABASE_URL?.replace(/\/$/,"");const key=runtime.SUPABASE_SECRET_KEY;if(!url||!key)throw new Error("Supabase Auth is not configured");return {url,key};}
export async function authRequest(path:string,body:unknown){const {url,key}=config();return fetch(`${url}/auth/v1/${path}`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(body),redirect:"manual",signal:AbortSignal.timeout(8000)});}
export function requestCookie(request:Request,name:string){for(const part of (request.headers.get("cookie")||"").split(";")){const [key,...value]=part.trim().split("=");if(key===name)return decodeURIComponent(value.join("="));}return "";}
export function sessionCookies(session:AuthSession){const age=Math.max(60,Math.min(session.expires_in||3600,3600));return [`stackscroll_access=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`,`stackscroll_refresh=${encodeURIComponent(session.refresh_token)}; Path=/api/auth; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict`];}
export const clearSessionCookies=["stackscroll_access=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax","stackscroll_refresh=; Path=/api/auth; Max-Age=0; HttpOnly; Secure; SameSite=Strict"];
export function appendCookies(response:Response,cookies:string[]){const headers=new Headers(response.headers);for(const value of cookies)headers.append("Set-Cookie",value);return new Response(response.body,{status:response.status,headers});}
