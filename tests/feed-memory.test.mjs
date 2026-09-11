import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=mkdtempSync(join(process.cwd(),'.feed-test-'));
after(()=>rmSync(temp,{recursive:true,force:true}));
const file=join(temp,'memory.mjs');
writeFileSync(file,ts.transpileModule(readFileSync('app/feed-memory.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
const {feedCandidates,emptyFeedMemory,parseFeedMemory,rotatedCandidates,stableFeed}=await import(pathToFileURL(file));
const now=Date.parse('2026-09-09T12:00:00Z'),day=86400000;
const card={id:'a',kind:'lesson',topic:'Cloud',level:'Foundation',title:'Example',source:'https://example.org',sourceName:'Example'};
test('recent exposure is suppressed; lessons have a longer cooldown; old news stays out',()=>{
 const memory=emptyFeedMemory();memory.seen={lesson:now-4*day,video:now-4*day};
 const lesson={...card,id:'lesson'},video={...card,id:'video',kind:'video'},news={...card,id:'news',kind:'news',date:new Date(now-8*day).toISOString()};
 assert.deepEqual(feedCandidates([lesson,video,news],memory,now).map(c=>c.id),['video']);
 assert.deepEqual(feedCandidates([lesson,video,news],memory,now,true).map(c=>c.id),['lesson','video']);
 assert.equal(feedCandidates([lesson],memory,now+4*day).length,1);
 memory.seen.video=now-1000;assert.equal(feedCandidates([video],memory,now).length,0);
 assert.equal(news.date,new Date(now-8*day).toISOString());
});
test('hidden cards remain hidden even during deliberate revisits',()=>{
 const memory={seen:{a:now-1000},dismissed:['a'],seed:0};
 assert.equal(feedCandidates([card],memory,now,true).length,0);
 memory.dismissed=[];assert.equal(feedCandidates([card],memory,now,true).length,1);
 assert.equal(feedCandidates([card],memory,now).length,0);
});
test('history validates storage and expires timestamps without losing hidden choices',()=>{
 const memory=parseFeedMemory(JSON.stringify({seen:{old:now-91*day,recent:now-1000,future:now+1,bad:'yesterday'},dismissed:['old'],seed:12}),now);
 assert.deepEqual(memory.seen,{recent:now-1000});assert.deepEqual(memory.dismissed,['old']);
 assert.throws(()=>parseFeedMemory('{broken',now));
 assert.throws(()=>parseFeedMemory(JSON.stringify({seen:[],dismissed:[],seed:0}),now));
});
test('rotation preserves identities while background changes cannot reorder the current queue',()=>{
 const cards=Array.from({length:15},(_,i)=>({...card,id:String(i)}));
 const first=rotatedCandidates(cards,1),next=rotatedCandidates(cards,2);
 assert.notDeepEqual(first.map(c=>c.id),next.map(c=>c.id));
 assert.deepEqual(new Set(first.map(c=>c.id)),new Set(next.map(c=>c.id)));
 const ids=first.map(c=>c.id);
 const inventory=cards.filter(c=>c.id!=='3').map(c=>({...c,title:'Updated'}));
 const stable=stableFeed(ids,[{...card,id:'new'},...inventory]);
 assert.deepEqual(stable.map(c=>c.id),ids.filter(id=>id!=='3'));
 assert.equal(stable[0].title,'Updated');assert.equal(stable.some(c=>c.id==='new'),false);
});
