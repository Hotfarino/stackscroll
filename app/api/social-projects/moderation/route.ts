import {z} from "zod";
import {database,isModerator,json,readBody,writeAccess} from "../../../video-server";

type PendingRow={id:string;platform:string;post_url:string;creator_handle:string;title:string;summary:string;build_idea:string;tags:string;created_at:number};
function project(row:PendingRow){let tags:string[]=[];try{tags=JSON.parse(row.tags) as string[];}catch{}return {id:row.id,platform:row.platform,postUrl:row.post_url,creatorHandle:row.creator_handle,title:row.title,summary:row.summary,buildIdea:row.build_idea,tags,createdAt:row.created_at};}

export async function GET(request:Request){
 if(!isModerator(request))return json({error:"Creator-project moderation is available only to the workspace owner."},403);
 try{const result=await database().prepare("SELECT id,platform,post_url,creator_handle,title,summary,build_idea,tags,created_at FROM social_projects WHERE status='pending' ORDER BY created_at ASC LIMIT 100").all<PendingRow>();return json({items:result.results.map(project)});}
 catch{return json({error:"The creator-project queue could not be loaded."},503);}
}

const actionSchema=z.object({id:z.string().uuid(),action:z.enum(["approve","reject"])}).strict();
export async function POST(request:Request){
 const denied=writeAccess(request);if(denied)return denied;
 if(!isModerator(request))return json({error:"Owner access is required."},403);
 let value:unknown;try{value=await readBody(request,256);}catch{return json({error:"Invalid moderation action."},400);}
 const parsed=actionSchema.safeParse(value);if(!parsed.success)return json({error:"Invalid moderation action."},400);
 try{const status=parsed.data.action==="approve"?"approved":"rejected",result=await database().prepare("UPDATE social_projects SET status=?,updated_at=? WHERE id=? AND status='pending'").bind(status,Date.now(),parsed.data.id).run();if(!result.meta.changes)return json({error:"This request is no longer pending. Refresh the queue."},409);return json({ok:true,status});}
 catch{return json({error:"The moderation decision could not be saved."},503);}
}
