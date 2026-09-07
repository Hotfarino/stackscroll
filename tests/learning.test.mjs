import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const temp = mkdtempSync(join(process.cwd(), '.learning-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));
for (const name of ['culture', 'content', 'learning', 'news', 'preferences']) {
 const source=readFileSync(`app/${name}.ts`,'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll('"./content"','"./content.mjs"').replaceAll('"./culture"','"./culture.mjs"');
 writeFileSync(join(temp,`${name}.mjs`),compiled);
}
const { cards, studyCards, topics } = await import(pathToFileURL(join(temp,'content.mjs')));
const { initialState, stateSchema, scheduleReview, isDue, quizScore, localDay } = await import(pathToFileURL(join(temp,'learning.mjs')));
const { parseNews, newsSources } = await import(pathToFileURL(join(temp,'news.mjs')));
const { defaultPreferences, readPreferences, orderedTopics } = await import(pathToFileURL(join(temp,'preferences.mjs')));
test('display settings recover invalid values without discarding valid choices',()=>{
 assert.deepEqual(readPreferences('{broken'),defaultPreferences);
 const p=readPreferences(JSON.stringify({skin:'daylight',layout:'unknown',textScale:999,showActivity:false,pinnedTopics:['Cloud','Cloud','Networking']}));
 assert.equal(p.skin,'daylight');assert.equal(p.layout,'stream');assert.equal(p.textScale,100);
 assert.equal(p.showActivity,false);assert.deepEqual(p.pinnedTopics,['Cloud','Networking']);
 assert.deepEqual(readPreferences('null'),defaultPreferences);
});
test('pinning moves topics first without removing other learning areas',()=>{
 const ordered=orderedTopics(['Cloud','Networking']);
 assert.deepEqual(ordered.slice(0,2),['Cloud','Networking']);
 assert.equal(ordered.length,topics.length);assert.deepEqual(new Set(ordered),new Set(topics));
});
test('every topic is represented and every quiz has an answer and explanation',()=>{
 assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
 for(const topic of topics)assert.ok(cards.some(c=>c.topic===topic));
 for(const card of cards.filter(c=>c.kind==='quiz')){assert.ok(card.options[card.answer]);assert.ok(card.explanation.length>40);}
});
test('flashcards move out of the queue until their scheduled review',()=>{
 const card=cards.find(c=>c.kind==='flashcard');const time=1000000000;
 assert.ok(isDue(card,initialState,time));
 const scheduled=scheduleReview(undefined,'good',time);
 const state={...initialState,reviews:{[card.id]:scheduled}};
 assert.equal(isDue(card,state,time),false);
 assert.equal(isDue(card,state,time+86400000),true);
 assert.equal(scheduleReview(scheduled,'easy',time).interval,4);
 assert.equal(scheduleReview(scheduled,'again',time).due,time+600000);
});
test('unanswered quizzes never depress accuracy',()=>{
 assert.deepEqual(quizScore(initialState),{total:0,correct:0});
 const [a,b]=cards.filter(c=>c.kind==='quiz');
 assert.deepEqual(quizScore({...initialState,answers:{[a.id]:a.answer,[b.id]:(b.answer+1)%4}}),{total:2,correct:1});
});
test('saved state rejects corrupt data and unsafe links',()=>{
 assert.ok(stateSchema.safeParse(initialState).success);
 assert.equal(stateSchema.safeParse({...initialState,answers:{a:99}}).success,false);
 assert.equal(stateSchema.safeParse({...initialState,saved:[{...cards[0],source:'javascript:alert(1)'}]}).success,false);
 assert.equal(localDay(new Date(2026,8,7,23,59)),'2026-09-07');
});
test('publisher RSS is decoded, dated, and restricted to its source host',()=>{
 const xml='<rss><channel><item><title><![CDATA[Agents &amp; code]]></title><link>https://github.blog/changelog/example/</link><pubDate>Mon, 07 Sep 2026 08:00:00 GMT</pubDate></item><item><title>Unsafe</title><link>javascript:alert(1)</link><pubDate>Mon, 07 Sep 2026 08:00:00 GMT</pubDate></item><item><title>Foreign host</title><link>https://attacker.example/</link><pubDate>Mon, 07 Sep 2026 08:00:00 GMT</pubDate></item></channel></rss>';
 const items=parseNews(xml,newsSources[0],Date.parse('2026-09-07T12:00:00Z'));
 assert.equal(items.length,1);assert.equal(items[0].title,'Agents & code');assert.equal(items[0].topic,'Agentic AI');
 assert.equal(items[0].date,'2026-09-07T08:00:00.000Z');
 assert.deepEqual(parseNews('<rss/>',newsSources[0]),[]);
});


test('culture cards survive saved-state reload alongside existing progress', () => {
 const culture = cards.filter(c => ['humor', 'anecdote', 'fact'].includes(c.kind));
 assert.equal(culture.length, 9);
 const original = {...initialState, saved: [studyCards[0], ...culture], answers: {'quiz-dns': 1}, reviews: {'flash-cidr': {due: 123456, interval: 1}}, done: {'net-mac': '2026-09-07'}};
 assert.deepEqual(stateSchema.parse(JSON.parse(JSON.stringify(original))), original);
 for (const card of culture) {
  assert.ok(card.source.startsWith('https://'));
  assert.ok(card.sourceNote);
  assert.equal(isDue(card, initialState), false);
  if (card.kind !== 'humor') assert.match(card.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
 }
});

test('mixed feed retains every study card and places lighter content between lessons', () => {
 assert.equal(studyCards.length, 31);
 assert.deepEqual(cards.filter(c => !['humor', 'anecdote', 'fact'].includes(c.kind)), studyCards);
 assert.equal(cards[3].kind, 'humor');
 assert.equal(cards[7].kind, 'anecdote');
 assert.equal(cards[11].kind, 'fact');
 assert.equal(cards.length, 40);
 assert.ok(studyCards.every(c => ['lesson', 'quiz', 'flashcard'].includes(c.kind)));
});
