import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=mkdtempSync(join(process.cwd(),'.learning-test-'));
after(()=>rmSync(temp,{recursive:true,force:true}));
for(const name of ['content','mixed-feed','editorial-content','learning']){
 const code=ts.transpileModule(readFileSync(`app/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll('"./content"','"./content.mjs"');writeFileSync(join(temp,name+'.mjs'),code);
}
const load=name=>import(pathToFileURL(join(temp,name+'.mjs')));
const {mixedFeed,eligibleCard,preferenceScore,feedReason}=await load('mixed-feed');
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
test('editorial bookmarks resolve against curated records, retaining source and type',()=>{
 assert.equal(editorialCards.filter(item=>item.kind==='story').length,2);
 assert.equal(editorialCards.filter(item=>item.kind==='podcast').length,3);
 assert.ok(stateSchema.safeParse({...initialState,saved:editorialCards}).success);
 const original=editorialCards[0];
 assert.deepEqual(resolveEditorialMedia([{...original,source:'https://attacker.example/'}]),[original]);
 assert.deepEqual(resolveEditorialMedia([{...original,id:'removed'}]),[]);
 for(const item of editorialCards)assert.ok(eligibleCard(item,now));
});
