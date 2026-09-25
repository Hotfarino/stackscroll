import {json} from "../../../video-server";
import {appendCookies,clearSessionCookies} from "../../../supabase-auth-server";
export async function POST(request:Request){if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"This request must come from Stackscroll."},403);return appendCookies(json({ok:true}),clearSessionCookies);}
