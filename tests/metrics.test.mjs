import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import ts from "typescript";

const uri=code=>"data:text/javascript;base64,"+Buffer.from(code).toString("base64");
const compile=path=>ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const sql=new DatabaseSync(":memory:");sql.exec(readFileSync("drizzle/0005_modern_rumiko_fujikawa.sql","utf8"));
const binding={prepare(query){return {bind(...args){return {run:async()=>sql.prepare(query).run(...args),all:async()=>({results:sql.prepare(query).all(...args)})};}};},batch:async statements=>Promise.all(statements.map(statement=>statement.run()))};
globalThis.metricDb=binding;
const helper=uri(`export const database=()=>globalThis.metricDb;export const json=(x,status=200)=>Response.json(x,{status});export const isModerator=r=>r.headers.get('owner')==='yes';export const readBody=async(r,max)=>{const text=await r.text();if(text.length>max)throw Error();return JSON.parse(text)};`);
const codes=uri(compile("app/metric-codes.ts"));
const server=uri(compile("app/metrics-server.ts").replace('"./video-server"',JSON.stringify(helper)).replace('"./metric-codes"',JSON.stringify(codes)));
const route=await import(uri(compile("app/api/metrics/route.ts").replace('"../../video-server"',JSON.stringify(helper)).replace('"../../metric-codes"',JSON.stringify(codes)).replace('"../../metrics-server"',JSON.stringify(server))));
const request=(body,origin="https://stack.example")=>new Request("https://stack.example/api/metrics",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(body)});

test("anonymous metrics accept only same-origin predefined aggregate codes",async()=>{
 assert.equal((await route.POST(request({code:"page-view",surface:"feed"}))).status,201);
 assert.equal((await route.POST(request({code:"page-view",surface:"feed"},"https://other.example"))).status,403);
 for(const body of [{code:"page-view",surface:"feed",user:"private"},{code:"search-use",surface:"/secret-url"},{code:"search-use",surface:"feed",term:"password"},{code:"unknown",surface:"feed"}])assert.equal((await route.POST(request(body))).status,400);
 const row={...sql.prepare("SELECT code,origin,count FROM diagnostic_buckets").get()};
 assert.deepEqual(row,{code:"metric:page-view",origin:"feed",count:1});
});

test("metric storage contains no visitor, URL, search, or content columns",()=>{
 assert.deepEqual(sql.prepare("PRAGMA table_info(diagnostic_buckets)").all().map(row=>row.name),["hour","code","origin","count","last_seen"]);
 const client=readFileSync("app/metrics-client.tsx","utf8");
 assert.doesNotMatch(client,/user_id|email|searchParams|location\.href|document\.title|videoId/);
 assert.match(client,/sessionStorage/);assert.match(client,/30\*60000/);
});

test("dashboard reads are owner-only and diagnostics exclude usage buckets",async()=>{
 assert.equal((await route.GET(new Request("https://stack.example/api/metrics"))).status,403);
 const diagnostics=readFileSync("app/api/diagnostics/route.ts","utf8");
 assert.match(diagnostics,/code NOT LIKE 'metric:%'/);
 const worker=readFileSync("worker/index.ts","utf8");
 assert.match(worker,/request\.method==="POST"&&url\.pathname==="\/api\/metrics"/);
});

test("the signed-in owner sees a metrics link in the profile panel",()=>{const profile=readFileSync("app/profile.tsx","utf8"),session=readFileSync("app/api/auth/session/route.ts","utf8");assert.match(session,/owner:isModeratorId\(id\)/);assert.match(profile,/session\.owner/);assert.match(profile,/owner&&<section className="profile-owner-tools"/);assert.match(profile,/href="\/metrics"/);assert.match(profile,/Development metrics/);});
