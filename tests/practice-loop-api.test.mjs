import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=file=>ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const server=uri(`export let eligible=true;export let offline=false;export function configure(e,o=false){eligible=e;offline=o;}export function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}})}export function database(){if(offline)throw Error('offline');return {prepare(){return {bind(){return {async first(){return eligible?{user_id:'fixture'}:null}}}}}}}`);
const stub=await import(server);
const route=compile('app/api/practice-loop/route.ts').replace(/(['"])\.\.\/\.\.\/video-server\1/,JSON.stringify(server)).replace(/(['"])\.\.\/\.\.\/personal-stacks\1/,JSON.stringify(uri('export const adultPolicy="18plus-v1";'))).replace(/(['"])\.\.\/\.\.\/certification-bank\1/,JSON.stringify(uri(compile('app/certification-bank.ts')))).replace(/(['"])\.\.\/\.\.\/certification-catalog\1/,JSON.stringify(uri(compile('app/certification-catalog.ts'))));
const {GET}=await import(uri(route));
const request=user=>new Request('https://test.example/api/practice-loop',{headers:user?{'oai-authenticated-user-id':user}:{}});
test('loop requires identity and age confirmation; outages return a recoverable error',async()=>{
 assert.equal((await GET(request())).status,401);stub.configure(false);assert.equal((await GET(request('test-user'))).status,403);stub.configure(true,true);assert.equal((await GET(request('test-user'))).status,503);stub.configure(true);
});
test('loop serves only original CompTIA practice and isolates local history namespaces by account',async()=>{
 const a=await GET(request('test-user')),data=await a.json(),other=await (await GET(request('other-fixture'))).json();
 assert.equal(a.status,200);assert.match(a.headers.get('Cache-Control'),/no-store/);assert.equal(data.tracks.length,3);assert.equal(data.tracks.flatMap(t=>t.questions).length,24);assert.ok(data.tracks.every(t=>['a-core-1','a-core-2','network-plus'].includes(t.id)));assert.match(data.storageScope,/^[a-f0-9]{64}$/);assert.notEqual(data.storageScope,other.storageScope);assert.equal(data.user_id,undefined);assert.ok(data.tracks.every(t=>t.questions.every(q=>q.correct.length&&q.explanation&&q.sources.length)));
});
