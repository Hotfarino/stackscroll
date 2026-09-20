import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const compile=path=>ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0004_high_moonstone.sql','utf8'));
globalThis.ingestionTestDb={prepare(sql){return {bind(...args){const stmt=sqlite.prepare(sql);return {async first(){return stmt.get(...args)||null;},async run(){return {meta:{changes:stmt.run(...args).changes}};}};}};}};
const collector=uri(compile('app/news-collector.ts').replace('"./content"',JSON.stringify(uri('export const curatedNews=[];'))).replace('"./news"',JSON.stringify(uri(compile('app/news.ts')))).replace('"./fresh-discoveries"',JSON.stringify(uri(compile('app/fresh-discoveries.ts')))));
const ingestion=uri(compile('app/news-ingestion.ts').replace('"./video-server"',JSON.stringify(uri('export const database=()=>globalThis.ingestionTestDb;'))).replace('"./news-collector"',JSON.stringify(collector)));
const {ingestNews,readNewsSnapshot}=await import(ingestion);
test('50 background jobs share one durable lease and preserve partial successes',async()=>{
 const original=globalThis.fetch;let calls=0;const date=new Date(Date.now()-60000).toISOString();
 globalThis.fetch=async input=>{calls++;const url=String(input);await new Promise(r=>setTimeout(r,2));
  if(url.includes('aws.amazon.com'))throw new Error('Outage');
  if(url.includes('github.blog'))return new Response(`<rss><item><title>Release</title><link>https://github.blog/changelog/test</link><pubDate>${date}</pubDate></item></rss>`);
  if(url.includes('showstories'))return Response.json([123]);
  if(url.includes('/item/'))return Response.json({id:123,type:'story',title:'Show HN: Python debugger',time:Math.floor(Date.parse(date)/1000)});
  return Response.json([{paper:{id:'2609.01234',title:'Agent evaluation',publishedAt:date}}]);
 };
 try{const results=await Promise.all(Array.from({length:50},()=>ingestNews()));assert.equal(calls,21);assert.equal(results.filter(r=>r.status==='already-current-or-running').length,49);assert.equal((await readNewsSnapshot()).items.length,3);await ingestNews();assert.equal(calls,21);}finally{globalThis.fetch=original;}
});
test('full provider outage keeps durable last-good cards and reports stale',async()=>{
 const original=globalThis.fetch,clock=Date.now;Date.now=()=>clock()+3600001;globalThis.fetch=async()=>{throw new Error('Outage');};
 try{const r=await ingestNews();assert.equal(r.status,'stale');assert.equal((await readNewsSnapshot()).items.length,3);}finally{Date.now=clock;globalThis.fetch=original;}
});
test('expired worker lease is recoverable without overwriting newer lease ownership',async()=>{
 sqlite.prepare('UPDATE feed_ingestion SET lease_until=?,updated_at=0,lease_token=?').run(Date.now()+50000,'other');
 assert.equal((await ingestNews()).status,'already-current-or-running');
 sqlite.prepare('UPDATE feed_ingestion SET lease_until=?').run(Date.now()-1);
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('Outage');};
 try{assert.equal((await ingestNews()).count,3);assert.equal(sqlite.prepare('SELECT lease_token FROM feed_ingestion').get().lease_token,null);}finally{globalThis.fetch=original;}
});
