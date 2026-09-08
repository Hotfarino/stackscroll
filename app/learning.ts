import { z } from "zod";
import { cards, topics, type Card } from "./content";
const savedCard = z.object({id:z.string(),kind:z.enum(["lesson","quiz","flashcard","news","video"]),topic:z.enum(topics as [typeof topics[number],...typeof topics[number][]]),title:z.string(),level:z.enum(["Foundation","Intermediate","Advanced"]),body:z.string().optional(),takeaway:z.string().optional(),code:z.string().optional(),language:z.string().optional(),visual:z.enum(["network","subnet","workflow"]).optional(),options:z.array(z.string()).optional(),answer:z.number().optional(),explanation:z.string().optional(),back:z.string().optional(),source:z.string().url().refine(s=>s.startsWith("https://")),sourceName:z.string(),date:z.string().optional(),minutes:z.number().optional()});
export const stateSchema = z.object({saved:z.array(savedCard).max(500),done:z.record(z.string()),answers:z.record(z.number().int().min(0).max(3)),reviews:z.record(z.object({due:z.number(),interval:z.number().min(0)})),path:z.enum(["all","foundation","network","software","ai"])});
export type LearningState = z.infer<typeof stateSchema>;
export const initialState: LearningState = {saved:[],done:{},answers:{},reviews:{},path:"all"};
export function localDay(now = new Date()) {return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;}
export function scheduleReview(previous: {interval:number}|undefined, grade:"again"|"good"|"easy", now=Date.now()) {
 const interval = grade === "again" ? 10/1440 : grade === "easy" ? Math.max(4,(previous?.interval||0)*3) : Math.max(1,(previous?.interval||0)*2);
 return {interval,due:now+interval*86400000};
}
export function isDue(c:Card,state:LearningState,now=Date.now()) {return c.kind==="flashcard"&&(!state.reviews[c.id]||state.reviews[c.id].due<=now);}
export function quizScore(state:LearningState) {
 const attempted=cards.filter(c=>c.kind==="quiz"&&state.answers[c.id]!==undefined);
 return {total:attempted.length,correct:attempted.filter(c=>state.answers[c.id]===c.answer).length};
}
