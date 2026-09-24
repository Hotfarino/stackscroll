import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import path from "node:path";
import test from "node:test";

const root=process.cwd();

test("rate limiting uses a hashed user scope, durable storage and endpoint budgets",async()=>{
 const worker=await readFile(path.join(root,"worker/index.ts"),"utf8");
 const schema=await readFile(path.join(root,"db/schema.ts"),"utf8");
 const migration=await readFile(path.join(root,"drizzle/0006_api_rate_limits.sql"),"utf8");
 assert.match(worker,/crypto\.subtle\.digest\("SHA-256"/);assert.match(worker,/api_rate_limits/);assert.match(worker,/Retry-After/);assert.match(worker,/requestLimit/);
 assert.match(schema,/apiRateLimits/);assert.match(schema,/expires_at/);
 const db=new DatabaseSync(":memory:");db.exec(migration);const row=db.prepare("INSERT INTO api_rate_limits(scope,count,expires_at) VALUES (?,1,?) ON CONFLICT(scope) DO UPDATE SET count=count+1 RETURNING count").get("scope",Date.now()+60_000);assert.equal(row.count,1);assert.equal(db.prepare("INSERT INTO api_rate_limits(scope,count,expires_at) VALUES (?,1,?) ON CONFLICT(scope) DO UPDATE SET count=count+1 RETURNING count").get("scope",Date.now()+60_000).count,2);db.close();
});

test("device wipe removes only StackScroll storage and unregisters its offline shell",async()=>{
 const source=await readFile(path.join(root,"app/device-storage.ts"),"utf8");
 assert.match(source,/startsWith\("stackscroll-"\)/);assert.match(source,/caches\.delete/);assert.match(source,/registration\.unregister/);
 assert.doesNotMatch(source,/localStorage\.clear/);
});
