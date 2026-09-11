import {z} from "zod";
import {cards,topics,type Card,type Topic} from "./content";

export type LearningStack = {id:string;title:string;description:string;objective:string;topic:Topic;level:Card["level"];minutes:number;prerequisite:string;scenario:string;concept:Card;question:Card;recall:Card;related:string;steps:readonly string[]};
const find=(id:string)=>{const card=cards.find(item=>item.id===id);if(!card)throw new Error(`Missing learning card ${id}`);return card;};
export const stackSteps=["The situation","Understand","Try it","The reasoning","Wrap up"] as const;
export const dnsSource="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup";
const dnsConcept:Card={id:"stack-dns-concept",kind:"lesson",topic:"Networking",level:"Foundation",title:"Follow the name lookup.",body:"Your application needs an address for a hostname. A DNS resolver helps find the answer, which may come from its cache or other DNS servers. If the workstation reaches the server by IP but cannot resolve its full name, investigate name resolution next. That clue does not prove that the DNS server itself is broken.",takeaway:"Check the configured DNS server and query the name directly. Separate a missing DNS answer from a failure to reach the application.",code:"nslookup app.example.com",language:"Windows · example command",source:"https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/troubleshoot-dns-client-resolution-issues",sourceName:"Microsoft Learn · DNS client troubleshooting"};
const dnsRecall:Card={id:"stack-dns-recall",kind:"quiz",topic:"Networking",level:"Foundation",title:"A DNS query times out. What does that establish?",body:"A Windows nslookup query returns “DNS request timed out.” Which conclusion is supported by that result?",options:["The hostname definitely does not exist","The DNS server did not provide a response within the timeout","The web application is definitely offline","The workstation must have a faulty network adapter"],answer:1,explanation:"A timeout means a timely DNS response was not received. Check resolver reachability, filtering, and the DNS service. It does not establish that the queried name is absent or the application is offline.",source:dnsSource,sourceName:"Microsoft Learn · nslookup"};

function stack(data:Omit<LearningStack,"steps">):LearningStack{return {...data,steps:stackSteps};}
export const learningStacks:LearningStack[]=[
 stack({id:"dns-diagnosis",title:"When the IP works, but the name doesn’t.",description:"Separate a DNS clue from an application failure.",objective:"Choose the next useful check for a name-resolution problem.",topic:"Networking",level:"Foundation",minutes:5,prerequisite:"Know what a hostname and IP address are",scenario:"A colleague can reach an internal server by IP address, but its fully qualified domain name fails to resolve. Where should you look next?",concept:dnsConcept,question:{...find("quiz-dns"),body:"A workstation reaches a server by IP address but cannot resolve its fully qualified domain name. Which is the strongest next troubleshooting lead?",options:["The display adapter","DNS and name resolution","The server’s storage capacity","The keyboard driver"],explanation:"Reaching the IP shows that the tested IP path works. Failed name resolution makes DNS the strongest next lead, but does not identify the exact cause. Check the requested name and configured resolver; local cache, Hosts entries, or suffix settings can also affect name resolution.",source:"https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/troubleshoot-dns-client-resolution-issues",sourceName:"Microsoft Learn · DNS client troubleshooting"},recall:dnsRecall,related:"routing-decisions"}),
 stack({id:"routing-decisions",title:"Follow the packet to the right network.",description:"Connect next-hop addressing with route selection.",objective:"Distinguish link-layer next hops from IP routing decisions.",topic:"CCNA",level:"Intermediate",minutes:5,prerequisite:"IPv4 addresses and subnet prefixes",scenario:"A packet crosses a gateway and then matches two routes. The next-hop frame address and the selected network route answer different questions.",concept:find("net-mac"),question:find("ccna-route"),recall:{...find("ccna-route"),id:"stack-route-recall",title:"Which matching route is more specific?",body:"A destination matches both 172.16.0.0/12 and 172.20.0.0/16. Which prefix wins the forwarding lookup?",options:["/12","/16","Whichever was added first","The route with the shortest text"],answer:1,explanation:"Forwarding uses the longest matching prefix. /16 is more specific than /12. Administrative distance and metrics help select routes for a prefix; they do not override a longer matching prefix during forwarding."},related:"cloud-boundaries"}),
 stack({id:"cloud-boundaries",title:"Trace a cloud connection before changing a rule.",description:"Understand routing and stateful security groups.",objective:"Explain what a security group allows for response traffic.",topic:"Cloud",level:"Intermediate",minutes:5,prerequisite:"Basic IP networking",scenario:"An EC2 application receives an allowed request. Before opening more ports, work out how routing and security controls treat its reply.",concept:find("cloud-private"),question:find("cloud-sg"),recall:{...find("cloud-sg"),id:"stack-cloud-recall",title:"Does an allowed response need a matching reverse rule?",body:"Considering only an AWS security group, an instance receives an allowed connection. What happens to its response traffic?"},related:"agent-feedback"}),
 stack({id:"safe-shared-code",title:"Undo a mistake without disrupting the team.",description:"Use a clear contract when changing shared code.",objective:"Choose a Git command that preserves published history.",topic:"Development",level:"Foundation",minutes:4,prerequisite:"Basic commits and branches",scenario:"A teammate pushed a bad commit. Other people have already pulled the branch. How can you reverse the change while keeping their history usable?",concept:{...find("dev-git"),kind:"lesson",title:"Record the reversal as a new change.",body:find("dev-git").explanation,options:undefined,answer:undefined,explanation:undefined,code:"git revert <commit>",language:"Git · replace <commit> with the commit ID"},question:find("dev-git"),recall:{...find("dev-git"),id:"stack-git-recall",title:"What does git revert create?",body:"Choose the description that matches git revert.",options:["A new inverse commit","A deleted remote repository","A new stash entry","A forced update of every teammate’s branch"],answer:0},related:"agent-feedback"}),
 stack({id:"agent-feedback",title:"Give a coding agent a finish line.",description:"Turn a vague request into a checkable task.",objective:"Write a bounded brief with an observable success condition.",topic:"Agentic AI",level:"Intermediate",minutes:5,prerequisite:"A little experience reading code changes",scenario:"An agent can edit your project and run tools. Your brief needs to make successful work recognizable and consequential actions reviewable.",concept:find("agent-loop"),question:find("agent-scope"),recall:find("workflow-human"),related:"ml-generalization"}),
 stack({id:"ml-generalization",title:"Question the model’s perfect score.",description:"Separate training success from unseen-data performance.",objective:"Recognize overfitting and protect evaluation from leakage.",topic:"Machine learning",level:"Intermediate",minutes:5,prerequisite:"Training and test data",scenario:"A model performs beautifully during development but disappoints on new examples. Inspect the evaluation before assuming it is ready.",concept:find("ml-leakage"),question:find("ml-overfit"),recall:{...find("ml-overfit"),id:"stack-ml-recall",title:"What should guide your next investigation?",body:"Training accuracy is high, but representative held-out accuracy is much lower. Which issue should you investigate first?"},related:"agent-feedback"}),
 stack({id:"hardware-language",title:"Read an SSD specification accurately.",description:"Separate a connector’s shape from a storage protocol.",objective:"Identify what M.2, PCIe, and NVMe describe.",topic:"CompTIA",level:"Foundation",minutes:4,prerequisite:"Basic PC components",scenario:"A replacement drive fits an M.2 slot. The service ticket still needs a compatibility check: physical fit alone is not enough.",concept:{...find("quiz-nvme"),kind:"lesson",title:"Shape, bus, protocol.",body:find("quiz-nvme").explanation,options:undefined,answer:undefined,explanation:undefined},question:find("quiz-nvme"),recall:{...find("quiz-nvme"),id:"stack-nvme-recall",title:"Does M.2 alone guarantee NVMe?",body:"A product listing says only “M.2 SSD.” What can you safely conclude?",options:["Every M.2 SSD uses NVMe","It describes a form factor; check the supported interface and protocol","It always uses a SATA cable","It is system RAM"],answer:1},related:"dns-diagnosis"}),
];

export const sessionSchema=z.object({step:z.number().int().min(0).max(4),seen:z.array(z.number().int().min(0).max(3)).max(4),answer:z.number().int().min(0).max(3).nullable(),recallAnswer:z.number().int().min(0).max(3).nullable(),recallAt:z.number().nullable(),reviewDue:z.number().nullable(),completedAt:z.number().nullable(),saved:z.boolean()}).strict();
export type StackSession=z.infer<typeof sessionSchema>;
export type StoredSession={stackId:string;data:StackSession;revision:number;updatedAt:number};
export const blankSession=():StackSession=>({step:0,seen:[],answer:null,recallAnswer:null,recallAt:null,reviewDue:null,completedAt:null,saved:false});
export const feedbackSchema=z.object({topic:z.enum(topics as [Topic,...Topic[]]),preference:z.enum(["more","less","basic","advanced","neutral"])});
export type TopicFeedback=z.infer<typeof feedbackSchema>;
export type StackAction={type:"next"|"back"|"restart"|"save"|"review"|"answer"|"recall";answer?:number};

export function transitionSession(current:StackSession,action:StackAction,now=Date.now()):StackSession {
 const next={...current,seen:[...current.seen]};
 if(action.type==="save")return {...next,saved:!next.saved};
 if(action.type==="restart")return {...blankSession(),saved:next.saved};
 if(action.type==="answer"){
  if(next.step!==2||next.answer!==null||!Number.isInteger(action.answer)||action.answer!<0||action.answer!>3)throw new Error("Choose one answer during the practice step.");
  return {...next,answer:action.answer!,step:3,seen:[...new Set([...next.seen,2])]};
 }
 if(action.type==="recall"){
  if(!Number.isInteger(action.answer)||action.answer!<0||action.answer!>3)throw new Error("Choose a valid recall answer.");
  if(!next.reviewDue||next.reviewDue>now)throw new Error("This review is not due yet.");
  return {...next,recallAnswer:action.answer!,recallAt:now,reviewDue:null};
 }
 if(action.type==="review"&&!next.completedAt)throw new Error("Finish this stack before scheduling recall.");
 if(action.type==="review")return {...next,reviewDue:now+86400000};
 if(action.type==="back")return {...next,step:Math.max(0,next.step-1)};
 if(next.step<4){next.seen=[...new Set([...next.seen,next.step])];next.step+=1;}
 if(next.step===4&&!next.completedAt)next.completedAt=now;
 return next;
}

export function rankStacks(sessions:StoredSession[],feedback:TopicFeedback[],pathTopics:Topic[]=[],pinned:Topic[]=[]) {
 return learningStacks.map((stack,index)=>{
  const session=sessions.find(item=>item.stackId===stack.id);
  const setting=feedback.find(item=>item.topic===stack.topic)?.preference;
  let score=-index/100;
  let reason="A practical starting point from the curated collection.";
  if(pathTopics.includes(stack.topic)){score+=5;reason="Related to your selected career path.";}
  if(pinned.includes(stack.topic)){score+=3;reason="Matches one of your pinned topics.";}
  if(setting==="more"){score+=4;reason="You asked for more of this topic.";}
  if(setting==="less")score-=10;
  if(setting==="basic")score+=stack.level==="Foundation"?4:-4;
  if(setting==="advanced")score+=stack.level!=="Foundation"?4:-4;
  if(setting==="basic"||setting==="advanced")reason=`Adjusted toward ${setting==="basic"?"foundational":"more advanced"} material in this topic.`;
  if(session?.data.completedAt)score-=8;
  if(session&&!session.data.completedAt&&session.data.seen.length>0){score+=30;reason="Continue the stack you already started.";}
  return {stack,score,reason};
 }).sort((a,b)=>b.score-a.score);
}
