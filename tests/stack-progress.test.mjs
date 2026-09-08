import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const temp=mkdtempSync(join(process.cwd(),'.stack-test-'));
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync('drizzle/0001_normal_wendigo.sql','utf8'));
after(()=>{sqlite.close();rmSync(temp,{recursive:true,force:true});});
function compile(source,name){let code=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;for(const [from,to] of [['cloudflare:workers','./env.mjs'],['./content','./content.mjs'],['../../video-server','./video-server.mjs'],['../../stacks','./stacks.mjs']])code=code.replaceAll('"'+from+'"','"'+to+'"');writeFileSync(join(temp,name+'.mjs'),code);}
writeFileSync(join(temp,'env.mjs'),'export const env={};');
compile('app/content.ts','content');compile('app/stacks.ts','stacks');compile('app/video-server.ts','video-server');compile('app/api/stacks/route.ts','route');
const imp=name=>import(pathToFileURL(join(temp,name+'.mjs')));
const {env}=await imp('env');const route=await imp('route');
const {blankSession,transitionSession,rankStacks,learningStacks}=await imp('stacks');
function prepared(sql,args=[]){return {bind(...values){return prepared(sql,values);},async first(){return sqlite.prepare(sql).get(...args)??null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};}};}
const binding={prepare:prepared,async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};env.DB=binding;
function request(body,user='learner',origin='https://stackscroll.test'){return new Request('https://stackscroll.test/api/stacks',{method:body?'POST':'GET',headers:{...(user?{'oai-authenticated-user-id':user}:{}),'Content-Type':'application/json',origin},...(body?{body:JSON.stringify(body)}:{})});}
const command=(action,revision=0,stackId='dns-diagnosis')=>({operation:'session',stackId,revision,action});

test('a skipped question stays unattempted; back navigation keeps a resumable stack',()=>{
 let data=blankSession();data=transitionSession(data,{type:'next'},100);data=transitionSession(data,{type:'back'},100);
 assert.equal(data.step,0);assert.deepEqual(data.seen,[0]);
 const ranked=rankStacks([{stackId:'hardware-language',data,revision:1,updatedAt:100}],[]);
 assert.equal(ranked[0].stack.id,'hardware-language');assert.match(ranked[0].reason,/Continue/);
 for(let i=0;i<4;i++)data=transitionSession(data,{type:'next'},200);
 assert.equal(data.completedAt,200);assert.equal(data.answer,null);assert.equal(data.recallAt,null);
});

test('practice advances into reasoning and recall requires a due schedule',()=>{
 let data=transitionSession(transitionSession(blankSession(),{type:'next'},100),{type:'next'},100);
 assert.throws(()=>transitionSession(data,{type:'answer',answer:4}),/Choose/);
 data=transitionSession(data,{type:'answer',answer:1},100);assert.equal(data.step,3);assert.equal(data.answer,1);
 assert.throws(()=>transitionSession(data,{type:'answer',answer:2}),/Choose/);
 assert.throws(()=>transitionSession(data,{type:'review'},100),/Finish/);
 data=transitionSession(data,{type:'next'},100);data=transitionSession(data,{type:'review'},100);
 assert.throws(()=>transitionSession(data,{type:'recall',answer:1},100),/not due/);
 data=transitionSession(data,{type:'recall',answer:1},86400100);assert.equal(data.recallAt,86400100);assert.equal(data.reviewDue,null);
 data=transitionSession(data,{type:'review'},86400200);assert.equal(data.recallAt,86400100);assert.equal(data.recallAnswer,1);
 assert.throws(()=>transitionSession(data,{type:'recall',answer:0},86400200),/not due/);
});

test('all guided stacks have distinct later prompts, valid answers and references',()=>{
 for(const stack of learningStacks){assert.notEqual(stack.question.title,stack.recall.title);for(const card of [stack.question,stack.recall]){assert.equal(card.options.length,4);assert.ok(card.answer>=0&&card.answer<4);assert.ok(card.explanation);assert.match(card.source,/^https:\/\//);}}
 const order=rankStacks([], [{topic:'CompTIA',preference:'more'}]);assert.equal(order[0].stack.topic,'CompTIA');
 const less=rankStacks([], [{topic:'Networking',preference:'less'}]);assert.notEqual(less[0].stack.topic,'Networking');
});

test('stack API rejects anonymous, cross-origin, unknown and oversized writes',async()=>{
 assert.equal((await route.GET(request(null,null))).status,401);
 assert.equal((await route.POST(request(command({type:'next'}),null))).status,401);
 assert.equal((await route.POST(request(command({type:'next'}),'learner','https://attacker.test'))).status,403);
 assert.equal((await route.POST(request(command({type:'next'},0,'unknown')))).status,404);
 assert.equal((await route.POST(request({...command({type:'next'}),extra:'x'.repeat(9000)}))).status,400);
});

test('progress survives reads, is account-scoped, and rejects stale tab writes',async()=>{
 const created=await route.POST(request(command({type:'next'})));assert.equal(created.status,200);const {session}=await created.json();
 const own=await (await route.GET(request())).json();assert.equal(own.sessions[0].data.step,1);
 assert.deepEqual((await (await route.GET(request(null,'other'))).json()).sessions,[]);
 const stale=await route.POST(request(command({type:'next'})));assert.equal(stale.status,409);assert.equal((await stale.json()).session.data.step,1);
 const next=await route.POST(request(command({type:'next'},session.revision)));assert.equal(next.status,200);assert.equal((await next.json()).session.data.step,2);
});

test('clearing account data removes its records and preferences while preserving another account',async()=>{
 assert.equal((await route.POST(request(command({type:'save'}),'other'))).status,200);
 assert.equal((await route.POST(request({operation:'feedback',feedback:{topic:'Networking',preference:'less'}}))).status,200);
 assert.equal((await route.POST(request({operation:'clear'}))).status,200);
 assert.deepEqual(await (await route.GET(request())).json(),{sessions:[],feedback:[]});
 assert.equal((await (await route.GET(request(null,'other'))).json()).sessions.length,1);
});

test('unavailable database never pretends a read or a save succeeded',async()=>{
 env.DB=undefined;const old=console.error;console.error=()=>{};
 try{assert.equal((await route.GET(request())).status,503);assert.equal((await route.POST(request(command({type:'next'})))).status,503);}finally{env.DB=binding;console.error=old;}
});
