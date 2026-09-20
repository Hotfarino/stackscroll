import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=mkdtempSync(join(process.cwd(),'.learning-test-'));
after(()=>rmSync(temp,{recursive:true,force:true}));
for(const name of ['catalog-records','content','mixed-feed','editorial-content','learning']){
 const code=ts.transpileModule(readFileSync(`app/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll('"./content"','"./content.mjs"').replaceAll('"./catalog-records"','"./catalog-records.mjs"');writeFileSync(join(temp,name+'.mjs'),code);
}
const load=name=>import(pathToFileURL(join(temp,name+'.mjs')));
const {mixedFeed,eligibleCard,preferenceScore,feedReason,savedTopicSignals}=await load('mixed-feed');
const {editorialCards,resolveEditorialMedia}=await load('editorial-content');
const {stateSchema,initialState}=await load('learning');
const now=Date.parse('2026-09-08T12:00:00Z');
const card={id:'a',kind:'lesson',topic:'Cloud',level:'Foundation',title:'A useful idea',source:'https://example.org/reference',sourceName:'Publisher A'};
test('candidate gate rejects unsafe sources, invalid metadata and future content',()=>{
 for(const patch of [{source:'javascript:alert(1)'},{source:'https://user:pass@example.org/'},{topic:'Gaming'},{kind:'ad'},{title:''},{date:'tomorrow'},{date:'2026-09-09'}])assert.equal(eligibleCard({...card,...patch},now),false);
 assert.equal(eligibleCard(card,now),true);
});
test('syndicated external links and duplicate IDs do not fill the feed',()=>{
 const news={...card,kind:'news',date:'2026-09-07'};
 assert.equal(mixedFeed([news,{...news,id:'other',source:news.source+'?utm_source=feed'},{...card,title:'duplicate id'}],[],[],[],now).length,1);
 // Shared documentation is legitimate for different original practice cards.
 assert.equal(mixedFeed([card,{...card,id:'b',kind:'quiz'}],[],[],[],now).length,2);
});
test('explicit interests and level feedback change rank without hiding the rest',()=>{
 const pool=[card,{...card,id:'b',topic:'Networking'}];
 assert.equal(mixedFeed(pool,[{topic:'Networking',preference:'more'}],[],[],now)[0].id,'b');
 assert.equal(mixedFeed(pool,[{topic:'Cloud',preference:'less'}],[],[],now)[0].id,'b');
 assert.equal(mixedFeed(pool,[],[],[],now).length,2);
 assert.ok(preferenceScore(card,[{topic:'Cloud',preference:'basic'}])>preferenceScore({...card,level:'Advanced'},[{topic:'Cloud',preference:'basic'}]));
 assert.match(feedReason(card,[],['Cloud']),/career direction/);
});
test('nearby topic and publisher repetition loses priority',()=>{
 const pool=[card,{...card,id:'b'},{...card,id:'c',topic:'Networking',sourceName:'Publisher B'}];
 assert.deepEqual(mixedFeed(pool,[],[],[],now).map(item=>item.id),['a','c','b']);
});

test('lopsided inventories still produce balanced early topics and formats',()=>{
 const topicPool=[...Array.from({length:30},(_,i)=>({...card,id:`cloud-${i}`,source:`https://cloud.example/${i}`,sourceName:`Cloud ${i%3}`})),...['Networking','Languages','Agentic AI'].flatMap((topic,j)=>Array.from({length:6},(_,i)=>({...card,id:`topic-${j}-${i}`,topic,source:`https://topic${j}.example/${i}`,sourceName:`Topic ${j}`})))];
 const topicMix=mixedFeed(topicPool,[],[],[],now).slice(0,16);
 const topicCounts=Object.values(Object.groupBy(topicMix,item=>item.topic)).map(items=>items.length);
 assert.equal(topicCounts.length,4);assert.ok(Math.max(...topicCounts)-Math.min(...topicCounts)<=1);
 const formats=['news','video','lesson','resource'];
 const formatPool=formats.flatMap((kind,j)=>Array.from({length:kind==='resource'?60:12},(_,i)=>({...card,id:`format-${j}-${i}`,kind,source:`https://format${j}.example/${i}`,sourceName:`Format ${j}`,date:kind==='news'||kind==='video'?new Date(now-i*1000).toISOString():undefined})));
 const formatMix=mixedFeed(formatPool,[],[],[],now).slice(0,40);
 const formatCounts=Object.fromEntries(formats.map(kind=>[kind,formatMix.filter(item=>item.kind===kind).length]));
 assert.deepEqual(formatCounts,{news:10,video:10,lesson:10,resource:10});
});
test('editorial bookmarks resolve against curated records, retaining source and type',()=>{
 assert.equal(editorialCards.filter(item=>item.kind==='story').length,2);
 assert.equal(editorialCards.filter(item=>item.kind==='podcast').length,3);
 assert.ok(stateSchema.safeParse({...initialState,saved:editorialCards}).success);
 const original=editorialCards[0];
 assert.deepEqual(resolveEditorialMedia([{...original,source:'https://attacker.example/'}]),[original]);
 assert.deepEqual(resolveEditorialMedia([{...original,id:'removed'}]),[]);
 for(const item of editorialCards)assert.ok(eligibleCard(item,now));
});

test('active Stack emphasis changes relevance while retaining discovery and unique cards',()=>{
 const pool=Array.from({length:24},(_,i)=>({...card,id:`layer-${i}`,topic:i%3===0?'Agentic AI':i%3===1?'Data centers':'Cloud',sourceName:`Publisher ${i%4}`}));
 const layers=[{topic:'Agentic AI',emphasis:3},{topic:'Data centers',emphasis:1}];
 const result=mixedFeed(pool,[],[],[],now,layers);
 assert.equal(result[0].topic,'Agentic AI');
 assert.equal(result[4].topic,'Cloud');
 assert.equal(new Set(result.map(c=>c.id)).size,pool.length);
 assert.ok(preferenceScore({...card,topic:'Agentic AI'},[],[],[],layers)>preferenceScore({...card,topic:'Data centers'},[],[],[],layers));
});

test('saved interests are bounded, reversible and subordinate to explicit less feedback',()=>{
 const saved=Array.from({length:100},(_,i)=>({...card,id:`saved-${i}`}));
 const affinity=savedTopicSignals(saved);
 assert.equal(affinity.Cloud,6);
 assert.equal(savedTopicSignals([card,card]).Cloud,2);
 assert.deepEqual(savedTopicSignals([]),{});
 const pool=[{...card,id:'network',topic:'Networking'},card];
 assert.equal(mixedFeed(pool,[],[],[],now,[],affinity)[0].id,'a');
 assert.equal(mixedFeed(pool,[{topic:'Cloud',preference:'less'}],[],[],now,[],affinity)[0].id,'network');
 assert.match(feedReason(card,[],[],[],[],affinity),/saved cards/);
 assert.equal(preferenceScore(card,[],[],[],[{topic:'Cloud',emphasis:2}]),12);
});
