import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const compile=path=>ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0005_modern_rumiko_fujikawa.sql','utf8'));
const binding={prepare(query){return {bind(...args){return {run:async()=>sql.prepare(query).run(...args),all:async()=>({results:sql.prepare(query).all(...args)})};}};},batch:async statements=>Promise.all(statements.map(s=>s.run()))};
globalThis.diagnosticsDb=binding;
const helper=uri(`export const database=()=>globalThis.diagnosticsDb;export const json=(x,status=200)=>Response.json(x,{status});export const isModerator=r=>r.headers.get('owner')==='yes';export const writeAccess=r=>!r.headers.get('owner')?json({},401):r.headers.get('origin')!==new URL(r.url).origin?json({},403):null;export const readBody=async(r,max)=>{const text=await r.text();if(text.length>max)throw Error();return JSON.parse(text)};`);
const codes=uri(compile('app/diagnostic-codes.ts'));
const server=uri(compile('app/diagnostics-server.ts').replace('"./video-server"',JSON.stringify(helper)).replace('"./diagnostic-codes"',JSON.stringify(codes)));
const route=await import(uri(compile('app/api/diagnostics/route.ts').replace('"../../video-server"',JSON.stringify(helper)).replace('"../../diagnostic-codes"',JSON.stringify(codes)).replace('"../../diagnostics-server"',JSON.stringify(server))));
const {recordDiagnostic}=await import(server);
const request=(body,headers={owner:'yes',origin:'https://stack.example'})=>new Request('https://stack.example/api/diagnostics',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
test('owner authorization and strict allowlist reject personal or arbitrary payloads',async()=>{
 assert.equal((await route.GET(new Request('https://stack.example/api/diagnostics'))).status,403);
 assert.equal((await route.POST(request({code:'self-test'},{}))).status,401);
 assert.equal((await route.POST(request({code:'self-test'},{owner:'yes',origin:'https://other.example'}))).status,403);
 for(const payload of [{code:'browser-error',message:'private'},{code:'secret-search'},[],{code:'__proto__'}])assert.equal((await route.POST(request(payload))).status,400);
});
test('test report is persisted and grouped without identity or content columns',async()=>{
 assert.equal((await route.POST(request({code:'self-test'}))).status,201);
 await recordDiagnostic('news-source');await recordDiagnostic('news-source');
 const data=await(await route.GET(new Request('https://stack.example/api/diagnostics',{headers:{owner:'yes'}}))).json();
 assert.equal(data.rows.find(r=>r.code==='news-source').count,2);
 assert.equal(data.rows.find(r=>r.code==='self-test').origin,'browser');
 assert.deepEqual(sql.prepare('PRAGMA table_info(diagnostic_buckets)').all().map(r=>r.name),['hour','code','origin','count','last_seen']);
});
test('retention cleanup and count caps bound stored diagnostics',async()=>{
 sql.prepare('INSERT INTO diagnostic_buckets VALUES (?,?,?,?,?)').run(Date.now()-31*86400000,'browser-error','browser',1,Date.now());
 sql.prepare('UPDATE diagnostic_buckets SET count=10000 WHERE code=?').run('news-source');
 await recordDiagnostic('news-source');
 assert.equal(sql.prepare('SELECT count FROM diagnostic_buckets WHERE code=?').get('news-source').count,10000);
 assert.equal(sql.prepare('SELECT * FROM diagnostic_buckets WHERE code=?').get('browser-error'),undefined);
});
test('storage outage is non-fatal and diagnostic API reports unavailable',async()=>{
 globalThis.diagnosticsDb={prepare(){throw Error('private details');},batch(){throw Error('private details');}};
 assert.equal(await recordDiagnostic('news-request'),false);
 assert.equal((await route.POST(request({code:'self-test'}))).status,503);
 const r=await route.GET(new Request('https://stack.example/api/diagnostics',{headers:{owner:'yes'}}));assert.equal(r.status,503);assert.ok(!(await r.text()).includes('private details'));globalThis.diagnosticsDb=binding;
});
test('browser reports are deduplicated and contain only a predefined code',async()=>{
 const client=await import(uri(compile('app/diagnostics-client.tsx').replace('"react"',JSON.stringify(uri('export const useEffect=()=>{}'))).replace('"./diagnostic-codes"',JSON.stringify(codes))));
 const original=globalThis.fetch;globalThis.window={};let calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url,body:JSON.parse(init.body)});return new Response('{}');};
 try{assert.equal(await client.reportDiagnostic('browser-error'),true);assert.equal(await client.reportDiagnostic('browser-error'),false);assert.equal(calls.length,1);assert.deepEqual(calls[0],{url:'/api/diagnostics',body:{code:'browser-error'}});}finally{globalThis.fetch=original;delete globalThis.window;}
});
