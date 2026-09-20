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
 {url:"https://aws.amazon.com/blogs/architecture/feed/",name:"AWS Architecture",host:"aws.amazon.com",topic:"Cloud" as Topic},
 {url:"https://aws.amazon.com/blogs/security/feed/",name:"AWS Security",host:"aws.amazon.com",topic:"Cybersecurity" as Topic},
 {url:"https://aws.amazon.com/blogs/machine-learning/feed/",name:"AWS Machine Learning",host:"aws.amazon.com",topic:"Machine learning" as Topic},
 {url:"https://aws.amazon.com/blogs/compute/feed/",name:"AWS Compute",host:"aws.amazon.com",topic:"Cloud" as Topic},
 {url:"https://aws.amazon.com/blogs/containers/feed/",name:"AWS Containers",host:"aws.amazon.com",topic:"Cloud" as Topic},
 {url:"https://aws.amazon.com/blogs/networking-and-content-delivery/feed/",name:"AWS Networking",host:"aws.amazon.com",topic:"Networking" as Topic},
 {url:"https://aws.amazon.com/blogs/storage/feed/",name:"AWS Storage",host:"aws.amazon.com",topic:"Data centers" as Topic},
 {url:"https://devblogs.microsoft.com/typescript/feed/",name:"TypeScript",host:"devblogs.microsoft.com",topic:"Languages" as Topic},
 {url:"https://devblogs.microsoft.com/dotnet/feed/",name:".NET Blog",host:"devblogs.microsoft.com",topic:"Development" as Topic},
 {url:"https://devblogs.microsoft.com/python/feed/",name:"Python at Microsoft",host:"devblogs.microsoft.com",topic:"Languages" as Topic},
 {url:"https://huggingface.co/blog/feed.xml",name:"Hugging Face Blog",host:"huggingface.co",topic:"Machine learning" as Topic},
 {url:"https://blog.jupyter.org/feed",name:"Jupyter Blog",host:"blog.jupyter.org",topic:"Machine learning" as Topic},
 {url:"https://blogs.cisco.com/networking/feed",name:"Cisco Networking",host:"blogs.cisco.com",topic:"CCNA" as Topic},
 {url:"https://github.blog/engineering/feed/",name:"GitHub Engineering",host:"github.blog",topic:"Development" as Topic},
 {url:"https://github.blog/security/feed/",name:"GitHub Security",host:"github.blog",topic:"Cybersecurity" as Topic},
 {url:"https://security.googleblog.com/feeds/posts/default?alt=rss&redirect=false",name:"Google Security",host:"security.googleblog.com",topic:"Cybersecurity" as Topic},
 {url:"https://www.microsoft.com/en-us/security/blog/feed/",name:"Microsoft Security",host:"www.microsoft.com",topic:"Cybersecurity" as Topic},
 {url:"https://blogs.cisco.com/security/feed",name:"Cisco Security",host:"blogs.cisco.com",topic:"Cybersecurity" as Topic},
 {url:"https://aws.amazon.com/blogs/database/feed/",name:"AWS Database",host:"aws.amazon.com",topic:"Data engineering" as Topic},
 {url:"https://aws.amazon.com/blogs/big-data/feed/",name:"AWS Big Data",host:"aws.amazon.com",topic:"Data engineering" as Topic},
 {url:"https://airflow.apache.org/blog/index.xml",name:"Apache Airflow",host:"airflow.apache.org",topic:"Data engineering" as Topic},
 {url:"https://www.jenkins.io/rss.xml",name:"Jenkins",host:"www.jenkins.io",topic:"DevOps" as Topic},
 {url:"https://aws.amazon.com/blogs/devops/feed/",name:"AWS DevOps",host:"aws.amazon.com",topic:"DevOps" as Topic},
 {url:"https://github.blog/changelog/label/actions/feed/",name:"GitHub Actions",host:"github.blog",topic:"DevOps" as Topic},
 {url:"https://web.dev/static/blog/feed.xml",name:"Web.dev",host:"web.dev",topic:"Web & accessibility" as Topic},
 {url:"https://developer.chrome.com/static/blog/feed.xml",name:"Chrome Developers",host:"developer.chrome.com",topic:"Web & accessibility" as Topic},
 {url:"https://www.deque.com/blog/feed/",name:"Deque Accessibility",host:"www.deque.com",topic:"Web & accessibility" as Topic},
 {url:"https://android-developers.googleblog.com/feeds/posts/default",name:"Android Developers",host:"android-developers.googleblog.com",topic:"Mobile development" as Topic},
 {url:"https://www.swift.org/atom.xml",name:"Swift",host:"www.swift.org",topic:"Mobile development" as Topic},
 {url:"https://blog.arduino.cc/feed/",name:"Arduino",host:"blog.arduino.cc",topic:"Robotics & IoT" as Topic},
 {url:"https://www.raspberrypi.com/news/feed/",name:"Raspberry Pi",host:"www.raspberrypi.com",topic:"Robotics & IoT" as Topic},
 {url:"https://aws.amazon.com/blogs/iot/feed/",name:"AWS IoT",host:"aws.amazon.com",topic:"Robotics & IoT" as Topic},
];
export const NEWS_PER_SOURCE=80;
function clean(value:string) {
 return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g,"").replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity:string)=>{
  const named:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
  if(entity[0]!=="#")return named[entity.toLowerCase()]||"";
  const n=entity[1].toLowerCase()==="x"?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);
  return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):"";
 }).replace(/\s+/g," ").trim();
}
function field(item:string,name:string) {return clean(item.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]||"");}
// Only publisher-supplied image URLs; never guess artwork or fetch article pages.
export function newsImageUrl(value:string,base?:string):string|undefined {
 try {
  const url=new URL(clean(value),base);
  if(!value.trim()||url.protocol!=="https:"||url.username||url.password||url.port||!url.hostname.includes(".")||/^[\d.]+$/.test(url.hostname)||/[:\[\]]/.test(url.hostname)||/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname))return;
  return url.href;
 }catch{return;}
}
export function publisherImage(item:string,base:string):string|undefined {
 const markup=item.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"');
 const attr=(tag:string,name:string)=>tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`,"i"))?.[1]||"";
 const candidates=[...markup.matchAll(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*>/gi)].filter(([tag])=>/media:thumbnail/i.test(tag)||/^image\//i.test(attr(tag,"type"))||attr(tag,"medium")==="image"||/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(attr(tag,"url"))).map(([tag])=>attr(tag,"url"));
 for(const [tag] of markup.matchAll(/<img\b[^>]*>/gi)){
  if(["width","height"].some(key=>/^[12]$/.test(attr(tag,key))))continue;
  candidates.push(attr(tag,"src"));
 }
 return candidates.map(value=>newsImageUrl(value,base)).find(Boolean);
}
export function parseNews(xml:string,source:typeof newsSources[number],now=Date.now()):Card[] {
 const items:Card[]=[];
 for(const match of xml.matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi)) {
  const item=match[1],title=field(item,"title"),link=field(item,"link")||clean([...item.matchAll(/<link\b([^>]*)\/?>/gi)].map(m=>m[1]).filter(attrs=>! /\brel=["'](?:self|enclosure)["']/i.test(attrs)).map(attrs=>attrs.match(/\bhref=["']([^"']+)["']/i)?.[1]).find(Boolean)||""),date=field(item,"pubDate")||field(item,"published")||field(item,"updated");
  try {
   const url=new URL(link);const time=Date.parse(date);
   if(url.protocol!=="https:"||url.hostname!==source.host||url.username||url.password||url.port||!title||!Number.isFinite(time)||time>now||time<now-7*86400000)continue;
   const topic:Topic=["Cybersecurity","Data engineering","DevOps","Web & accessibility","Mobile development","Robotics & IoT"].includes(source.topic)?source.topic:/\bagents?\b|copilot|agentic/i.test(title)?"Agentic AI":/\brag\b|workflow|bedrock/i.test(title)?"AI workflows":/machine learning|\bllm\b|neural|model training/i.test(title)?"Machine learning":source.topic;
   const description=(field(item,"description")||field(item,"summary")).replace(/<[^>]*>/g,"").trim();
   const words=description.split(/\s+/).filter(Boolean);
   const preview=words.slice(0,24).join(" ").slice(0,320);
   items.push({id:`rss-${url.href}`,kind:"news",topic,level:"Intermediate",title:title.slice(0,240),body:preview?`Publisher preview: ${preview}${words.length>24?"…":""}`:`Latest from ${source.name}. Read the original for details.`,source:url.href,sourceName:source.name,date:new Date(time).toISOString(),newsImage:publisherImage(item,url.href)});
  }catch{continue;}
  if(items.length>=NEWS_PER_SOURCE)break;
 }
 return items;
}
