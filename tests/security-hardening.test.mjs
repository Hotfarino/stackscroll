import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();

test("worker places every API behind authentication and applies browser defenses",async()=>{
 const source=await readFile(path.join(root,"worker/index.ts"),"utf8");
 assert.match(source,/pathname\.startsWith\("\/api\/"\)/);assert.match(source,/oai-authenticated-user-id/);
 for(const value of ["Content-Security-Policy","Strict-Transport-Security","Permissions-Policy","Referrer-Policy","X-Content-Type-Options","X-Frame-Options","X-Robots-Tag","Cross-Origin-Opener-Policy"]){assert.ok(source.includes(value),`${value} missing`);}
 assert.match(source,/frame-ancestors 'none'/);assert.match(source,/object-src 'none'/);assert.match(source,/Cache-Control","no-store"/);
});

test("moderator identity comes only from a server-side environment allowlist",async()=>{
 const source=await readFile(path.join(root,"app/video-server.ts"),"utf8");
 assert.match(source,/STACKSCROLL_OWNER_IDS/);assert.doesNotMatch(source,/@gmail\.com|oai-authenticated-user-email/);
});

test("client output contains no source maps, private owner identifiers, or secret values",async()=>{
 const assets=path.join(root,"dist/client/assets");
 const names=await readdir(assets);assert.equal(names.some(name=>name.endsWith(".map")),false);
 const scripts=await Promise.all(names.filter(name=>name.endsWith(".js")).map(name=>readFile(path.join(assets,name),"utf8")));
 const output=scripts.join("\n");
 assert.doesNotMatch(output,/YOUTUBE_API_KEY|STACKSCROLL_OWNER_IDS|bigdawgroof@gmail\.com|art_v2_|siwc_bypass/i);
});
