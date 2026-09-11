import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=path=>ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const route=compile('app/api/news/route.ts').replace('"../../content"',JSON.stringify(uri('export const curatedNews=[];'))).replace('"../../news"',JSON.stringify(uri(compile('app/news.ts')))).replace('"../../fresh-discoveries"',JSON.stringify(uri(compile('app/fresh-discoveries.ts'))));
const {GET}=await import(uri(route));
test('50 simultaneous refreshes share one fetch batch and retain surviving sources',async()=>{
 const original=globalThis.fetch;let calls=0;const date=new Date(Date.now()-60000).toISOString();
 globalThis.fetch=async input=>{calls++;const url=String(input);await new Promise(resolve=>setTimeout(resolve,2));
  if(url.includes('aws.amazon.com'))throw new Error('Simulated outage');
  if(url.includes('github.blog'))return new Response(`<rss><channel><item><title>Release</title><link>https://github.blog/changelog/test</link><pubDate>${date}</pubDate></item></channel></rss>`);
  if(url.includes('showstories'))return Response.json([123]);
  if(url.includes('/item/'))return Response.json({id:123,type:'story',title:'Show HN: Python debugger',time:Math.floor(Date.parse(date)/1000)});
  return Response.json([{paper:{id:'2609.01234',title:'Agent evaluation',publishedAt:date}}]);
 };
 try{const results=await Promise.all(Array.from({length:50},async()=>{const r=await GET(new Request('https://example.com/api/news?refresh=1'));return r.json();}));assert.equal(calls,5);for(const r of results){assert.equal(r.status,'partial');assert.equal(r.items.length,3);assert.equal(r.sources.find(s=>s.name==="AWS What's New").status,'unavailable');}
 await GET(new Request('https://example.com/api/news?refresh=1'));assert.equal(calls,5,'Rapid repeat refresh must reuse cache');
 }finally{globalThis.fetch=original;}
});
