import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {loadFeed} from './helpers/feed-loader.mjs';
const f=await loadFeed();after(f.cleanup);
test('six added topics have eight real source-linked guides each',()=>{
 assert.equal(f.topics.length,16);assert.equal(f.expandedGuides.length,48);
 assert.equal(new Set(f.expandedGuides.map(c=>c.source)).size,48);
 for(const topic of f.topics.slice(10))assert.equal(f.expandedGuides.filter(c=>c.topic===topic).length,8);
});
test('saving three real guides moves each added topic earlier in the next mix',()=>{
 const before=f.mixedFeed(f.cards,[]);
 for(const topic of f.topics.slice(10)){
  const saved=f.cards.filter(c=>c.topic===topic).slice(0,3);
  const after=f.mixedFeed(f.cards,[],[],[],Date.now(),[],f.savedTopicSignals(saved));
  assert.ok(after.findIndex(c=>c.topic===topic)<before.findIndex(c=>c.topic===topic),topic);
  assert.equal(after.length,before.length);assert.equal(new Set(after.map(c=>c.id)).size,after.length);
  assert.ok(after.slice(0,24).some(c=>c.topic!==topic));
 }
});
test('unsaving and disabling personalization restore baseline ranking',()=>{
 const baseline=f.mixedFeed(f.cards,[]).map(c=>c.id);
 assert.deepEqual(f.mixedFeed(f.cards,[],[],[],Date.now(),[],f.savedTopicSignals([])).map(c=>c.id),baseline);
 assert.deepEqual(f.mixedFeed(f.cards,[],[],[],Date.now(),[],{}).map(c=>c.id),baseline);
});
test('stack suggestions require distinct repeated saves, respect less and opt-out, and never mutate data',()=>{
 const saved=f.expandedGuides.slice(0,3),before=JSON.stringify(saved);
 assert.deepEqual(f.stackInterestSuggestions([saved[0],saved[0]],[]),[]);
 assert.deepEqual(f.stackInterestSuggestions(saved,[]),[{topic:'Cybersecurity',saves:3}]);
 assert.deepEqual(f.stackInterestSuggestions(saved,[{topic:'Cybersecurity',preference:'less'}]),[]);
 assert.deepEqual(f.stackInterestSuggestions(saved,[],false),[]);
 assert.equal(JSON.stringify(saved),before);
 const less=f.mixedFeed(f.cards,[{topic:'Cybersecurity',preference:'less'}],[],[],Date.now(),[],f.savedTopicSignals(saved));
 assert.notEqual(less[0].topic,'Cybersecurity');
});
test('existing feed snapshot stays stable until explicit refresh, independent of saves',()=>{
 const baseline=f.mixedFeed(f.cards,[]),ids=baseline.map(c=>c.id);
 const reranked=f.mixedFeed(f.cards,[],[],[],Date.now(),[],f.savedTopicSignals(f.expandedGuides.slice(-3)));
 assert.deepEqual(f.stableFeed(ids,reranked).map(c=>c.id),ids);
 const memory=f.emptyFeedMemory();memory.dismissed=[f.expandedGuides[0].id];
 assert.ok(!f.feedCandidates(reranked,memory).some(c=>c.id===memory.dismissed[0]));
});
