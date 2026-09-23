import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {loadFeed} from './helpers/feed-loader.mjs';
const feed=await loadFeed();after(feed.cleanup);
const code=ts.transpileModule(readFileSync('app/content-rights.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const rights=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('catalog ships all 1000 records without publisher excerpts',()=>{
 assert.equal(feed.catalogCards.length,1000);
 assert.equal(feed.catalogCards.filter(card=>card.catalog?.excerpt).length,0);
 const stale={...feed.catalogCards[0],catalog:{...feed.catalogCards[0].catalog,excerpt:'Unverified old excerpt'}};
 assert.equal(rights.permittedCatalogExcerpt(stale),undefined);
 assert.equal(rights.permittedCatalogExcerpt({...stale,attribution:feed.licensedCards[0].attribution}),undefined);
 for(const file of ['feed-preview','catalog-card','repository-browser','content-search']){
  const source=readFileSync(`app/${file}.${file==='content-search'?'ts':'tsx'}`,'utf8');
  assert.match(source,/permittedCatalogExcerpt\(card\)/);
  assert.doesNotMatch(source,/meta\.excerpt|card\.catalog\?\.excerpt/);
 }
});
test('saved attribution survives removal of the current registry entry',()=>{
 const saved=JSON.parse(JSON.stringify(feed.licensedCards[0]));
 const work=rights.licensedWorks.shift();
 try{assert.deepEqual(rights.licensedWork(saved),saved.attribution);}
 finally{rights.licensedWorks.unshift(work);}
});
test('every licensed card has a matching exact-work record and stable unique ID',()=>{
 assert.equal(feed.licensedCards.length,4);
 assert.equal(new Set(feed.cards.map(c=>c.id)).size,feed.cards.length);
 for(const card of feed.licensedCards){
  assert.ok(rights.licensedWork(card));
  assert.equal(rights.permittedCardBody(card),card.body);
  assert.equal(rights.licensedWork({...card,source:card.source+'/other'}),undefined);
  assert.equal(rights.licensedWork({...card,id:'another-card'}),undefined);
 }
});
test('old RSS saves cannot restore unverified excerpts or images and are not mutated',()=>{
 const card={id:'rss-https://example.com/item',kind:'news',source:'https://example.com/item',sourceName:'Publisher',body:'Old unverified excerpt',newsImage:'https://example.com/photo.jpg'};
 const before=JSON.stringify(card);
 assert.match(rights.permittedCardBody(card),/excerpts are withheld/);
 assert.equal(rights.permittedNewsImage(card),undefined);
 assert.equal(JSON.stringify(card),before);
 for(const work of rights.licensedWorks)assert.equal(rights.permittedNewsImage({...card,source:work.source,id:work.id}),undefined);
});
test('unrelated original cards and community metadata stay unchanged',()=>{
 for(const id of ['original','hn-123','hf-paper-123']){
  const card={id,kind:'news',body:'Original summary'};
  assert.equal(rights.permittedCardBody(card),card.body);
 }
});
test('collapsed and full cards render source/license credits and guard persisted bodies',()=>{
 for(const file of ['feed-preview','learning-card']){
  const source=readFileSync(`app/${file}.tsx`,'utf8');
  assert.match(source,/<ContentCredit card=\{card\}/);
  assert.match(source,/permittedCardBody\(card\)/);
 }
 const credit=readFileSync('app/content-credit.tsx','utf8');
 assert.match(credit,/href=\{contentLicenseUrl\}/);
 assert.match(credit,/href=\{work.source\}/);
 assert.match(credit,/Condensed and rewritten/);
 assert.match(readFileSync('app/news-thumbnail.tsx','utf8'),/permittedNewsImage\(card\)/);
});
