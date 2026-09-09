import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync('app/fresh-discoveries.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {hnCard,paperCards,discoverHN,discoverPapers}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const now=Date.parse('2026-09-09T12:00:00Z');
const story={id:123,type:'story',title:'Show HN: A Python debugger',time:Math.floor(now/1000)-60};
test('community cards exclude deleted, non-tech and future submissions',()=>{
 assert.equal(hnCard(story,now).source,'https://news.ycombinator.com/item?id=123');
 for(const patch of [{dead:true},{deleted:true},{type:'comment'},{title:'Casino game'},{time:now/1000+1},{id:-1}])assert.equal(hnCard({...story,...patch},now),undefined);
});
test('papers use original publication dates and omit abstracts and generated summaries',()=>{
 const paper={id:'2609.01234',title:'Agent evaluation',publishedAt:'2026-09-07',summary:'DO NOT COPY',ai_summary:'DO NOT COPY'};
 const cards=paperCards([{paper,publishedAt:'2026-09-09'}],now);assert.equal(cards[0].date,'2026-09-07T00:00:00.000Z');assert.ok(!JSON.stringify(cards).includes('DO NOT COPY'));
 assert.equal(paperCards([{paper:{...paper,id:'../../evil'}},{paper:{...paper,publishedAt:'2030-01-01'}}],now).length,0);
});
test('partial HN failures preserve available items and restrict outbound destinations',async()=>{
 let calls=0;const result=await discoverHN(async(url,options)=>{calls++;assert.equal(options.redirect,'manual');assert.equal(new URL(url).hostname,'hacker-news.firebaseio.com');if(url.includes('showstories'))return Response.json([123,124,'malicious']);if(url.includes('/124.'))throw new Error('offline');return Response.json(story);});
 assert.equal(calls,3);assert.equal(result.partial,true);assert.equal(result.items.length,1);
});
test('paper redirects fail without following another host',async()=>{await assert.rejects(()=>discoverPapers(async()=>new Response(null,{status:302,headers:{Location:'https://example.com'}})));});
