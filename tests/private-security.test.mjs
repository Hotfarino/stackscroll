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
 const offline=await readFile(path.join(root,"app/offline-client.tsx"),"utf8");
 assert.match(source,/startsWith\("stackscroll-"\)/);assert.match(source,/caches\.delete/);assert.match(source,/registration\.unregister/);
 assert.match(source,/stackscroll-offline-disabled/);assert.match(offline,/stackscroll-offline-disabled/);
 assert.doesNotMatch(source,/localStorage\.clear/);
});

test("profile access is authenticated, same-origin for writes, and scoped to one user",async()=>{
 const route=await readFile(path.join(root,"app/api/profile/route.ts"),"utf8");
 assert.match(route,/headers\.get\("oai-authenticated-user-id"\)/);
 assert.match(route,/if\(!id\)return json\(\{error:"Sign in to load your profile\."\},401\)/);
 assert.match(route,/if\(!id\)return json\(\{error:"Sign in to save your profile\."\},401\)/);
 assert.match(route,/request\.headers\.get\("origin"\)!==new URL\(request\.url\)\.origin/);
 assert.match(route,/profiles\?user_id=eq\.\$\{encodeURIComponent\(id\)\}/);
 assert.match(route,/user_id:id/);
 assert.match(route,/stableUserPath\(id\)/);
 assert.doesNotMatch(route,/oai-authenticated-user-email/);
});

test("Supabase privileged credentials stay in server-only runtime code",async()=>{
 const helper=await readFile(path.join(root,"app/supabase-server.ts"),"utf8");
 const route=await readFile(path.join(root,"app/api/profile/route.ts"),"utf8");
 assert.match(helper,/from "cloudflare:workers"/);
 assert.match(helper,/SUPABASE_SECRET_KEY/);
 assert.match(helper,/headers\.set\("Authorization",`Bearer \$\{key\}`\)/);
 assert.match(helper,/expiresIn:3600/);
 assert.match(route,/\.\.\/\.\.\/supabase-server/);
 assert.doesNotMatch(route,/SUPABASE_SECRET_KEY|sb_secret_/);
});

test("account state sync validates each field and scopes every request to the signed-in user",async()=>{
 const route=await readFile(path.join(root,"app/api/user-state/route.ts"),"utf8");
 const client=await readFile(path.join(root,"app/account-state-client.ts"),"utf8");
 assert.match(route,/headers\.get\("oai-authenticated-user-id"\)/);
 assert.match(route,/request\.headers\.get\("origin"\)!==new URL\(request\.url\)\.origin/);
 assert.match(route,/user_state\?user_id=eq\.\$\{encodeURIComponent\(id\)\}/);
 assert.match(route,/fields\[input\.field\]\.parse\(input\.value\)/);
 assert.match(route,/user_id:id/);
 assert.doesNotMatch(client,/SUPABASE_SECRET_KEY|sb_secret_|service_role/);
 for(const field of ["learning_state","feed_memory","preferences","video_playlist"]){assert.ok(route.includes(field),`${field} is not synchronized`);}
});

test("Supabase Auth sessions use secure http-only cookies and same-origin account writes",async()=>{
 const helper=await readFile(path.join(root,"app/supabase-auth-server.ts"),"utf8");
 const signIn=await readFile(path.join(root,"app/api/auth/sign-in/route.ts"),"utf8");
 const signUp=await readFile(path.join(root,"app/api/auth/sign-up/route.ts"),"utf8");
 assert.match(helper,/HttpOnly; Secure; SameSite=Lax/);
 assert.match(helper,/HttpOnly; Secure; SameSite=Strict/);
 assert.match(signIn,/request\.headers\.get\("origin"\)!==new URL\(request\.url\)\.origin/);
 assert.match(signUp,/request\.headers\.get\("origin"\)!==new URL\(request\.url\)\.origin/);
 assert.doesNotMatch(await readFile(path.join(root,"app/account-access.tsx"),"utf8"),/SUPABASE_SECRET_KEY|stackscroll_access/);
});
