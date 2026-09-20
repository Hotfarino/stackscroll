import { type Card, type Topic } from "./content";
export const newsSources = [
 {url:"https://github.blog/changelog/feed/",name:"GitHub Changelog",host:"github.blog",topic:"Development" as Topic},
 {url:"https://aws.amazon.com/about-aws/whats-new/recent/feed/",name:"AWS What's New",host:"aws.amazon.com",topic:"Cloud" as Topic},
 {url:"https://kubernetes.io/feed.xml",name:"Kubernetes Blog",host:"kubernetes.io",topic:"Cloud" as Topic},
 {url:"https://devblogs.microsoft.com/engineering-at-microsoft/feed/",name:"Microsoft Engineering",host:"devblogs.microsoft.com",topic:"Development" as Topic},
 {url:"https://blog.cloudflare.com/rss/",name:"Cloudflare Engineering",host:"blog.cloudflare.com",topic:"Networking" as Topic},
 {url:"https://developers.googleblog.com/feeds/posts/default/",name:"Google for Developers",host:"developers.googleblog.com",topic:"Development" as Topic},
 {url:"https://www.docker.com/feed/",name:"Docker Blog",host:"www.docker.com",topic:"Cloud" as Topic},
 {url:"https://blog.rust-lang.org/feed.xml",name:"Rust Blog",host:"blog.rust-lang.org",topic:"Languages" as Topic},
 {url:"https://nodejs.org/en/feed/blog.xml",name:"Node.js Blog",host:"nodejs.org",topic:"Languages" as Topic},
 {url:"https://www.postgresql.org/news.rss",name:"PostgreSQL News",host:"www.postgresql.org",topic:"Development" as Topic},
 {url:"https://developer.nvidia.com/blog/feed/",name:"NVIDIA Technical Blog",host:"developer.nvidia.com",topic:"Machine learning" as Topic},
 {url:"https://www.cncf.io/feed/",name:"CNCF",host:"www.cncf.io",topic:"Cloud" as Topic},
 {url:"https://docs.gitlab.com/releases/releases.xml",name:"GitLab Releases",host:"docs.gitlab.com",topic:"Development" as Topic},
 {url:"https://blog.python.org/feeds/posts/default?alt=rss",name:"Python Insider",host:"blog.python.org",topic:"Languages" as Topic},
 {url:"https://go.dev/blog/feed.atom",name:"Go Blog",host:"go.dev",topic:"Languages" as Topic},
 {url:"https://openai.com/news/rss.xml",name:"OpenAI News",host:"openai.com",topic:"Agentic AI" as Topic},
 {url:"https://azure.microsoft.com/en-us/blog/feed/",name:"Azure Blog",host:"azure.microsoft.com",topic:"Cloud" as Topic},
 {url:"https://www.redhat.com/en/rss/blog/channel/red-hat-enterprise-linux",name:"Red Hat Enterprise Linux",host:"www.redhat.com",topic:"Cloud" as Topic},
];
export const NEWS_PER_SOURCE=40;
function clean(value:string) {
 return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g,"").replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity:string)=>{
  const named:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
  if(entity[0]!=="#")return named[entity.toLowerCase()]||"";
  const n=entity[1].toLowerCase()==="x"?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);
  return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):"";
 }).replace(/\s+/g," ").trim();
}
function field(item:string,name:string) {return clean(item.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]||"");}
export function parseNews(xml:string,source:typeof newsSources[number],now=Date.now()):Card[] {
 const items:Card[]=[];
 for(const match of xml.matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi)) {
  const item=match[1],title=field(item,"title"),link=field(item,"link")||clean([...item.matchAll(/<link\b([^>]*)\/?>/gi)].map(m=>m[1]).filter(attrs=>! /\brel=["'](?:self|enclosure)["']/i.test(attrs)).map(attrs=>attrs.match(/\bhref=["']([^"']+)["']/i)?.[1]).find(Boolean)||""),date=field(item,"pubDate")||field(item,"published")||field(item,"updated");
  try {
   const url=new URL(link);const time=Date.parse(date);
   if(url.protocol!=="https:"||url.hostname!==source.host||url.username||url.password||url.port||!title||!Number.isFinite(time)||time>now||time<now-7*86400000)continue;
   const ai=/copilot|agent|\bai\b|model|machine learning|bedrock/i.test(title);
   items.push({id:`rss-${url.href}`,kind:"news",topic:ai?"Agentic AI":source.topic,level:"Intermediate",title:title.slice(0,240),body:`Publisher headline from ${source.name}. Open the original for context, evidence, and implementation details. Publisher claims have not been independently verified.`,source:url.href,sourceName:source.name,date:new Date(time).toISOString()});
  }catch{continue;}
  if(items.length>=NEWS_PER_SOURCE)break;
 }
 return items;
}
