import { type Card, type Topic } from "./content";
export const newsSources = [
 {url:"https://github.blog/changelog/feed/",name:"GitHub Changelog",host:"github.blog",topic:"Development" as Topic},
 {url:"https://aws.amazon.com/about-aws/whats-new/recent/feed/",name:"AWS What's New",host:"aws.amazon.com",topic:"Cloud" as Topic},
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
 for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
  const item=match[1],title=field(item,"title"),link=field(item,"link"),date=field(item,"pubDate");
  try {
   const url=new URL(link);const time=Date.parse(date);
   if(url.protocol!=="https:"||url.hostname!==source.host||url.username||url.password||url.port||!title||!Number.isFinite(time)||time>now)continue;
   const ai=/copilot|agent|\bai\b|model|machine learning|bedrock/i.test(title);
   items.push({id:`rss-${url.href}`,kind:"news",topic:ai?"Agentic AI":source.topic,level:"Intermediate",title:title.slice(0,240),body:`A release update from ${source.name}. Read the original announcement for availability, requirements, and implementation details.`,source:url.href,sourceName:source.name,date:new Date(time).toISOString()});
  }catch{continue;}
  if(items.length>=8)break;
 }
 return items;
}
