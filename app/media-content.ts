import type {Card,Topic} from "./content";
export type QuoteRecord={id:string;quote:string;author:string;context:string;prompt:string;topic:Topic;source:string;sourceName:string;checkedAt:string};
export type ExplainerRecord={id:string;title:string;topic:Topic;level:Card["level"];duration:number;description:string;video:string;poster:string;captions:string;transcript:string[];sources:{name:string;url:string}[];stackId:string};
export const quotes:QuoteRecord[]=[
  {
    "id": "quote-web-universal",
    "quote": "By design, the Web is universal, royalty-free, open and decentralised.",
    "author": "Tim Berners-Lee",
    "context": "From his 2014 message marking 25 years of the Web. An invitation to think about the open standards behind everyday tools.",
    "prompt": "Open your browser’s Network panel. Reload a page and identify its document, stylesheet, and API requests. Which standards let them work together?",
    "topic": "Networking",
    "source": "https://www.w3.org/webat25/news/tbl-web25-welcome",
    "sourceName": "W3C · Web at 25",
    "checkedAt": "2026-09-08"
  },
  {
    "id": "quote-fowler-refactoring",
    "quote": "Refactoring is a controlled technique for improving the design of an existing code base.",
    "author": "Martin Fowler",
    "context": "Fowler introduces refactoring as small changes that improve design while preserving behavior.",
    "prompt": "Choose a small script, rename one unclear variable, and extract one repeated block. Check that the output stays the same.",
    "topic": "Development",
    "source": "https://martinfowler.com/books/refactoring.html",
    "sourceName": "Martin Fowler · Refactoring",
    "checkedAt": "2026-09-08"
  },
  {
    "id": "quote-peters-explicit",
    "quote": "Explicit is better than implicit.",
    "author": "Tim Peters",
    "context": "One of the design aphorisms in the Zen of Python, published as PEP 20.",
    "prompt": "Find a script with a hard-coded timeout or port. Give that value a descriptive name and document its unit.",
    "topic": "Languages",
    "source": "https://peps.python.org/pep-0020/",
    "sourceName": "Python · PEP 20",
    "checkedAt": "2026-09-08"
  },
  {
    "id": "quote-knuth-test",
    "quote": "Beware of bugs in the above code; I have only proved it correct, not tried it.",
    "author": "Donald Knuth",
    "context": "Knuth identifies this as the closing sentence of a memo he drafted in March 1977.",
    "prompt": "Take a function that looks correct. Run it with empty input, a boundary value, and an unexpected type. Record what each case reveals.",
    "topic": "Development",
    "source": "https://cs.stanford.edu/~knuth/faq.html",
    "sourceName": "Stanford · Knuth’s FAQ",
    "checkedAt": "2026-09-08"
  }
];
export const explainers:ExplainerRecord[]=[
 {id:"original-dns",title:"What happens when you look up a name?",topic:"Networking",level:"Foundation",duration:28,description:"Follow a simplified DNS lookup from a device to its resolver, then separate a lookup clue from an application failure.",video:"/media/dns-in-motion.mp4",poster:"/media/dns-in-motion.png",captions:"/media/dns-in-motion.vtt",transcript:["Your app needs an address for a name before it connects.", "The client sends the question to its configured DNS resolver.", "The resolver may already have a usable answer in its cache.", "If needed, it asks other DNS servers to find the answer.", "If found, the resolver replies with the requested address.", "Use nslookup to query a name and inspect the DNS response. Example command: nslookup app.example.com.", "Name resolution failure is not proof the app server is broken.", "Simplified flow. Local hosts files, client caches, record types, referrals and transport details are omitted. The example address is illustrative."],sources:[{name:"Microsoft Learn · DNS client troubleshooting",url:"https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/troubleshoot-dns-client-resolution-issues"},{name:"Microsoft Learn · nslookup",url:"https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup"}],stackId:"dns-diagnosis"},
 {id:"original-agent-loop",title:"A coding agent needs a feedback loop.",topic:"Agentic AI",level:"Intermediate",duration:32,description:"Turn a vague coding request into a bounded task with an observable result and a clear finish line.",video:"/media/agent-feedback-loop.mp4",poster:"/media/agent-feedback-loop.png",captions:"/media/agent-feedback-loop.vtt",transcript:["A coding agent makes progress by checking what its tools did.", "Start with a bounded task and a clear success condition.", "Use a tool to inspect code, make an edit, or run a check.", "Choose tests that check the intended behavior.", "Read failures, revise the change, and run relevant checks again.", "Finish when the task is met. Report checks and remaining limits.", "Ask for authorization before consequential production actions.", "Confident text is not a passed check.", "Relevant behavior tests and explicit authorization for consequential production actions are Stackscroll recommendations informed by source principles."],sources:[{name:"Anthropic Engineering · Building effective agents",url:"https://www.anthropic.com/engineering/building-effective-agents"}],stackId:"agent-feedback"},
];
export const quoteAsCard=(quote:QuoteRecord):Card=>({id:quote.id,kind:"quote",topic:quote.topic,level:"Foundation",title:quote.quote,source:quote.source,sourceName:quote.author});
export const explainerAsCard=(clip:ExplainerRecord):Card=>({id:clip.id,kind:"explainer",topic:clip.topic,level:clip.level,title:clip.title,source:clip.sources[0].url,sourceName:"Stackscroll · AI-authored animation"});
export const mediaCards=()=>[...quotes.map(quoteAsCard),...explainers.map(explainerAsCard)];
// Saved media resolves through today's authored catalog, never arbitrary saved URLs.
export function resolveOriginalMedia(saved:Card[]):Card[]{return saved.flatMap(card=>{if(card.kind==="quote"){const quote=quotes.find(item=>item.id===card.id);return quote?[quoteAsCard(quote)]:[];}if(card.kind==="explainer"){const clip=explainers.find(item=>item.id===card.id);return clip?[explainerAsCard(clip)]:[];}return [card];});}
