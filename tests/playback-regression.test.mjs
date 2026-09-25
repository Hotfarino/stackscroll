import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();

test("feed owns one active player across curated, catalog and original video types",async()=>{
 const source=await readFile(path.join(root,"app/stackscroll.tsx"),"utf8");
 assert.match(source,/setActiveCatalogVideo\(null\);setActiveVideo\(next\)/);
 assert.match(source,/setActiveVideo\(null\);setActiveCatalogVideo\(card\.id\)/);
 assert.match(source,/setActiveOriginal\(null\)/);
 assert.match(source,/const unloadVideos=.*setActiveVideo\(null\).*setActiveCatalogVideo\(null\)/s);
});

test("YouTube players load on demand, unload outside the viewport and never force an external redirect",async()=>{
 for(const file of ["app/video-card.tsx","app/catalog-card.tsx"]){
  const source=await readFile(path.join(root,file),"utf8");
  assert.match(source,/IntersectionObserver/);
  assert.match(source,/intersectionRatio<(?:0)?\.15/);
  assert.match(source,/onUnload\(\)/);
  assert.match(source,/youtube-nocookie\.com/);
  assert.match(source,/target="_blank"/);
  assert.doesNotMatch(source,/location\.(?:assign|replace)|window\.open/);
 }
 const catalog=await readFile(path.join(root,"app/video-catalog.ts"),"utf8");
 assert.match(catalog,/playsinline=1/);
 assert.match(catalog,/youtube-nocookie\.com\/embed/);
});

test("unavailable playback keeps an optional YouTube link and reports an inline error",async()=>{
 const curated=await readFile(path.join(root,"app/video-card.tsx"),"utf8");
 const catalog=await readFile(path.join(root,"app/catalog-card.tsx"),"utf8");
 assert.match(curated,/role="alert"/);
 assert.match(curated,/Watch on YouTube/);
 assert.match(curated,/Optional · Stackscroll never redirects you automatically/);
 assert.match(catalog,/This video is unavailable or cannot be embedded/);
 assert.match(catalog,/Watch on YouTube \(optional\)/);
});

test("anonymous state stays local while authenticated state synchronizes",async()=>{
 const client=await readFile(path.join(root,"app/account-state-client.ts"),"utf8");
 const app=await readFile(path.join(root,"app/stackscroll.tsx"),"utf8");
 assert.match(client,/if\(!await hasAccount\(\)\)return null/);
 assert.match(client,/if\(!await hasAccount\(\)\)return;/);
 assert.match(client,/fetch\("\/api\/user-state"/);
 assert.match(app,/localStorage\.setItem\("stackscroll-learning-v1"/);
});

test("expired access sessions can refresh without exposing tokens to client code",async()=>{
 const session=await readFile(path.join(root,"app/api/auth/session/route.ts"),"utf8");
 const helper=await readFile(path.join(root,"app/supabase-auth-server.ts"),"utf8");
 assert.match(session,/grant_type=refresh_token/);
 assert.match(session,/requestCookie\(request,"stackscroll_refresh"\)/);
 assert.match(session,/sessionCookies\(result\)/);
 assert.match(helper,/HttpOnly; Secure; SameSite=Strict/);
});
