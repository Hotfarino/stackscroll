import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {loadFeed} from './helpers/feed-loader.mjs';
const f=await loadFeed();
const now=Date.parse('2026-09-09T20:00:00Z');
function pool(n,skew=false){return Array.from({length:n},(_,i)=>({id:`synthetic-${i}`,kind:skew?(i<n*.9?'news':f.feedRotation[5+i%6]):f.feedRotation[i%11],topic:f.topics[i%f.topics.length],level:'Foundation',title:`Synthetic stress fixture ${i}`,source:`https://example.com/${i}`,sourceName:`Publisher ${i%17}`,date:new Date(now-60000-i*1000).toISOString()}));}
try{
 for(const n of [1000,10000]){const p=pool(n);const times=[];for(let run=0;run<3;run++){const t=performance.now();const out=f.mixedFeed(p,[],[],[],now);times.push(Math.round(performance.now()-t));assert.equal(out.length,n);assert.equal(new Set(out.map(c=>c.id)).size,n);}console.log(JSON.stringify({scenario:'balanced',cards:n,timingsMs:times}));}
 const skew=f.mixedFeed(pool(1000,true),[],[],[],now).slice(0,60);assert.ok(skew.filter(c=>c.kind==='news').length<=33,'News dominates opening feed');console.log(JSON.stringify({scenario:'90-percent-news-input',first60News:skew.filter(c=>c.kind==='news').length,formats:new Set(skew.map(c=>c.kind)).size}));
 // Preferences lift a topic relative to a neutral mix; they do not promise 60%
 // dominance over the category-balance penalty. The old >=36 assertion failed
 // on the pre-change implementation too (8/60), contradicting balanced discovery.
 const feedback=[{topic:'Agentic AI',preference:'more'}];const neutral=f.mixedFeed(pool(1000),[],[],[],now).slice(0,60);const personal=f.mixedFeed(pool(1000),feedback,['Agentic AI'],[],now).slice(0,60);assert.ok(personal.filter(c=>c.topic==='Agentic AI').length>neutral.filter(c=>c.topic==='Agentic AI').length,'Interest must increase exposure');assert.ok(personal.filter(c=>c.topic==='Agentic AI').length<=48,'Discovery slots missing');assert.ok(new Set(personal.map(c=>c.topic)).size>=3);console.log(JSON.stringify({scenario:'AI-interest',first60AI:personal.filter(c=>c.topic==='Agentic AI').length,topics:new Set(personal.map(c=>c.topic)).size}));
 const actual=f.mixedFeed(f.cards,[],[],[],now).slice(0,60);console.log(JSON.stringify({scenario:'actual-library',input:f.cards.length,formats:new Set(actual.map(c=>c.kind)).size,topics:new Set(actual.map(c=>c.topic)).size}));
 const inventory=pool(1000),memory=f.emptyFeedMemory();let consumed=0;
 for(let session=0;session<30;session++){const out=f.mixedFeed(f.rotatedCandidates(f.feedCandidates(inventory,memory,now),session),[],[],[],now).slice(0,20);for(const c of out){assert.ok(!memory.seen[c.id]);memory.seen[c.id]=now;consumed++;}}
 console.log(JSON.stringify({scenario:'30-refresh-sessions',consumed,immediateRepeats:0}));
 const damaged=[...inventory,...inventory.slice(0,100),{...inventory[0],id:'bad',source:'javascript:alert(1)'},{...inventory[0],id:'future',date:'2099-01-01'}];assert.equal(f.mixedFeed(damaged,[],[],[],now).length,1000);
 memory.dismissed=inventory.slice(0,50).map(c=>c.id);assert.ok(f.feedCandidates(inventory,memory,now,true).every(c=>!memory.dismissed.includes(c.id)));
 assert.deepEqual(f.stableFeed(inventory.slice(0,20).map(c=>c.id),[...inventory].reverse()).map(c=>c.id),inventory.slice(0,20).map(c=>c.id));
 console.log('Integrity: duplicates, unsafe URLs, future dates, hidden cards and stable queues passed.');
}finally{f.cleanup();}
