import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const load=async file=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText).toString('base64'));
const f=await load('app/practice-loop.ts'),{examBanks}=await load('app/certification-bank.ts');
const bank=['a-core-1','a-core-2','network-plus'].flatMap(examId=>examBanks[examId].map(q=>({...q,examId,examName:examId,examCode:examId})));
const now=Date.parse('2026-09-09T12:00:00Z');
test('24 original questions recycle through 100 rounds without duplicates within a round',()=>{
 let progress={},previous='';let questions=0;const encountered=new Set();
 for(let seed=0;seed<100;seed++){
  const round=f.makePracticeRound(bank,progress,seed,now,previous);assert.equal(round.length,8);assert.equal(new Set(round.map(q=>q.id)).size,8);assert.notEqual(round[0].id,previous);
  for(const q of round){encountered.add(q.id);assert.ok(f.exactAnswer(q,q.correct));progress[q.id]=f.recordPractice(progress[q.id],true,now);previous=q.id;questions++;}
 }
 assert.equal(questions,800);assert.equal(encountered.size,24);
});
test('missed questions lead next round, and unseen questions come before early repeats',()=>{
 const miss=bank[12],fresh=bank[13];const progress=Object.fromEntries(bank.filter(q=>q!==fresh).map(q=>[q.id,f.recordPractice(undefined,q!==miss,now)]));
 const round=f.makePracticeRound(bank,progress,11,now);assert.equal(round[0].id,miss.id);assert.equal(round[1].id,fresh.id);
 const selected=f.makePracticeRound(bank.filter(q=>q.examId==='network-plus'),{},1,now);assert.ok(selected.every(q=>q.examId==='network-plus'));
});
test('option permutations preserve correct text for all questions and exact multi-select scoring',()=>{
 let changed=false;for(let seed=1;seed<30;seed++)for(const original of bank){const q=f.shuffleQuestion(original,seed);assert.deepEqual(q.correct.map(i=>q.options[i]).sort(),original.correct.map(i=>original.options[i]).sort());assert.equal(new Set(q.options).size,4);if(JSON.stringify(q.options)!==JSON.stringify(original.options))changed=true;assert.equal(f.exactAnswer(q,[]),false);assert.equal(f.exactAnswer(q,[...q.correct,q.correct[0]]),false);}
 assert.ok(changed);const multi=bank.find(q=>q.selectCount===2);assert.equal(f.exactAnswer(multi,[multi.correct[0]]),false);assert.ok(f.exactAnswer(multi,[...multi.correct].reverse()));
});
test('review advances when due; same-day repeats do not push the due date out',()=>{
 const first=f.recordPractice(undefined,true,now);assert.equal(first.due,now+f.DAY);
 const early=f.recordPractice(first,true,now+1000);assert.equal(early.due,first.due);assert.equal(early.streak,1);
 const later=f.recordPractice(first,true,first.due);assert.equal(later.due,first.due+3*f.DAY);
 const missed=f.recordPractice(later,false,now);assert.equal(missed.streak,0);assert.equal(missed.due,now+600000);assert.equal(missed.missed,true);
});
test('history validates records and round-trips without touching exam attempts or feed history',()=>{
 const ids=new Set(bank.map(q=>q.id));const data={[bank[0].id]:f.recordPractice(undefined,true,now)};
 assert.deepEqual(f.parseLoopProgress(JSON.stringify(data),ids),data);assert.deepEqual(f.parseLoopProgress(null,ids),{});
 for(const raw of ['{','[]',JSON.stringify({[bank[0].id]:{...data[bank[0].id],attempts:-1}}),JSON.stringify({[bank[0].id]:{...data[bank[0].id],correct:99}})])assert.throws(()=>f.parseLoopProgress(raw,ids));
 assert.deepEqual(f.parseLoopProgress('{"removed-question":{}}',ids),{});
});
