import { type Card, type Topic } from "./content";
export const newsSources = [
 {url:"https://github.blog/changelog/feed/",name:"GitHub Changelog",host:"github.blog",topic:"Development" as Topic},
 {url:"https://aws.amazon.com/about-aws/whats-new/recent/feed/",name:"AWS What's New",host:"aws.amazon.com",topic:"Cloud" as Topic},
 {url:"https://kubernetes.io/feed.xml",name:"Kubernetes Blog",host:"kubernetes.io",topic:"Cloud" as Topic},
 {url:"https://devblogs.microsoft.com/engineering-at-microsoft/feed/",name:"Microsoft Engineering",host:"devblogs.microsoft.com",topic:"Development" as Topic},
];
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
  if(items.length>=24)break;
 }
 return items;
}
