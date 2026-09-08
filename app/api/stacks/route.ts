import {z} from "zod";
import {database,json,readBody} from "../../video-server";
import {blankSession,sessionSchema,feedbackSchema,learningStacks,transitionSession,type StoredSession} from "../../stacks";
type Row={stack_id:string;data:string;revision:number;updated_at:number};
const stored=(row:Row):StoredSession=>({stackId:row.stack_id,data:sessionSchema.parse(JSON.parse(row.data)),revision:row.revision,updatedAt:row.updated_at});
const commandSchema=z.discriminatedUnion("operation",[
 z.object({operation:z.literal("session"),stackId:z.string().max(80),revision:z.number().int().nonnegative(),action:z.object({type:z.enum(["next","back","restart","save","review","answer","recall"]),answer:z.number().int().min(0).max(3).optional()}).strict()}).strict(),
 z.object({operation:z.literal("feedback"),feedback:feedbackSchema}).strict(),
 z.object({operation:z.literal("reset-feedback")}).strict(),
 z.object({operation:z.literal("clear")}).strict(),
]);
export async function GET(request:Request){
 const user=request.headers.get("oai-authenticated-user-id");
 if(!user)return json({error:"Sign in to load your stacks."},401);
 try{
  const db=database();
  const [sessions,feedback]=await Promise.all([
   db.prepare("SELECT stack_id,data,revision,updated_at FROM stack_sessions WHERE user_id = ?").bind(user).all<Row>(),
   db.prepare("SELECT topic,preference FROM topic_feedback WHERE user_id = ?").bind(user).all(),
  ]);
  return json({sessions:sessions.results.map(stored),feedback:feedback.results.map(item=>feedbackSchema.parse(item))});
 }catch(error){console.error("Stack storage read failed",error);return json({error:"Your saved stacks could not be loaded. Try again."},503);}
}
export async function POST(request:Request){
 const user=request.headers.get("oai-authenticated-user-id");
 if(!user)return json({error:"Sign in to save your progress."},401);
 if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"This request must come from Stackscroll."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return json({error:"JSON is required."},415);
 let command:z.infer<typeof commandSchema>;
 try{command=commandSchema.parse(await readBody(request));}catch{return json({error:"That learning update is not valid."},400);}
 try{
  const db=database(),now=Date.now();
  if(command.operation==="clear"){
   await db.batch([db.prepare("DELETE FROM stack_sessions WHERE user_id = ?").bind(user),db.prepare("DELETE FROM topic_feedback WHERE user_id = ?").bind(user)]);
   return json({ok:true});
  }
  if(command.operation==="reset-feedback"){
   await db.prepare("DELETE FROM topic_feedback WHERE user_id = ?").bind(user).run();return json({ok:true});
  }
  if(command.operation==="feedback"){
   await db.prepare("INSERT INTO topic_feedback (user_id,topic,preference,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,topic) DO UPDATE SET preference=excluded.preference,updated_at=excluded.updated_at").bind(user,command.feedback.topic,command.feedback.preference,now).run();
   return json({ok:true});
  }
  if(!learningStacks.some(stack=>stack.id===command.stackId))return json({error:"Stack not found."},404);
  const row=await db.prepare("SELECT stack_id,data,revision,updated_at FROM stack_sessions WHERE user_id = ? AND stack_id = ?").bind(user,command.stackId).first<Row>();
  const current=row?stored(row):null;
  if(command.revision!==(current?.revision??0))return json({error:"Progress changed in another tab. The latest version is now shown.",session:current,stackId:command.stackId},409);
  let data;
  try{data=transitionSession(current?.data??blankSession(),command.action,now);}catch(error){return json({error:error instanceof Error?error.message:"Invalid step."},422);}
  const revision=Math.max(now,(current?.revision??0)+1);
  const result=current
   ?await db.prepare("UPDATE stack_sessions SET data = ?,revision = ?,updated_at = ? WHERE user_id = ? AND stack_id = ? AND revision = ?").bind(JSON.stringify(data),revision,now,user,command.stackId,command.revision).run()
   :await db.prepare("INSERT INTO stack_sessions (user_id,stack_id,data,revision,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,stack_id) DO NOTHING").bind(user,command.stackId,JSON.stringify(data),revision,now).run();
  if(result.meta.changes!==1){
   const latest=await db.prepare("SELECT stack_id,data,revision,updated_at FROM stack_sessions WHERE user_id = ? AND stack_id = ?").bind(user,command.stackId).first<Row>();
   return json({error:"Progress changed in another tab. The latest version is now shown.",session:latest?stored(latest):null,stackId:command.stackId},409);
  }
  return json({session:{stackId:command.stackId,data,revision,updatedAt:now}});
 }catch(error){console.error("Stack storage write failed",error);return json({error:"This change could not be saved. Your current step is kept; try again."},503);}
}
