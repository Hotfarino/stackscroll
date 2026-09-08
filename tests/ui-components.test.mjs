import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readCssTree(entryPath);
      }
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("emits the catalog's animation and scrolling utilities", async () => {
  const css = await readCssTree(path.join(root, "dist"));

  assert.match(css, /--tw-enter-opacity/);
  assert.match(css, /scrollbar-width:\s*thin/);
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /scroll-fade-reveal-b/);
  assert.match(css, /mask-image:/);
  assert.match(css, /tw-shimmer/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("forwards progress semantics to the primitive", async () => {
  const { Progress } = await vite.ssrLoadModule("/components/ui/progress.tsx");
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 37 }));

  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, /aria-valuetext="37%"/);
  assert.match(html, /data-state="loading"/);
});

test("emits chart themes for the starter's media dark mode", async () => {
  const { ChartStyle } = await vite.ssrLoadModule("/components/ui/chart.tsx");
  const html = renderToStaticMarkup(
    React.createElement(ChartStyle, {
      id: "contract",
      config: {
        latency: { theme: { light: "#ffffff", dark: "#000000" } },
      },
    }),
  );

  assert.match(html, /\[data-chart=contract\]/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(html, /\.dark/);
});

test("renders sidebar skeletons deterministically", async () => {
  const { SidebarMenuSkeleton } = await vite.ssrLoadModule(
    "/components/ui/sidebar.tsx",
  );
  const first = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));
  const second = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));

  assert.equal(first, second);
  assert.match(first, /--skeleton-width:70%/);
});

test("video players make no embedded requests before a click and respect blocking and expiry", async () => {
  const { VideoCard } = await vite.ssrLoadModule("/app/video-card.tsx");
  const { videoCatalog, createPlaybackSession } = await vite.ssrLoadModule("/app/video-catalog.ts");
  const video = {...videoCatalog[0],rights:{...videoCatalog[0].rights,checkedAt:new Date(Date.now()-1000).toISOString(),recheckAfter:new Date(Date.now()+86400000).toISOString()}};
  const props={video,session:createPlaybackSession(),saved:false,blocked:false,active:false,onActivate(){},onUnload(){},onSave(){}};
  const render=extra=>renderToStaticMarkup(React.createElement(VideoCard,{...props,...extra}));
  const before=render({});
  assert.doesNotMatch(before,/<(?:iframe|img|script)\b/);
  assert.match(before,/Load YouTube player/);
  assert.match(before,/Factual review pending/);
  assert.doesNotMatch(before,/Mark learned/);
  const after=render({active:true});
  assert.match(after,/<iframe[^>]+src="https:\/\/www.youtube-nocookie.com\/embed\//);
  assert.match(after,/referrerPolicy="strict-origin-when-cross-origin"/i);
  assert.match(after,/autoplay=0/);
  assert.doesNotMatch(render({active:true,blocked:true}),/<iframe\b/);
  assert.doesNotMatch(render({active:true,video:{...video,rights:{...video.rights,status:'revoked'}}}),/<iframe\b/);
});


test("stack recap separates skipped practice from later recall", async()=>{
 const {StackSessionView}=await vite.ssrLoadModule("/app/stack-session.tsx");
 const {learningStacks,blankSession}=await vite.ssrLoadModule("/app/stacks.ts");
 const html=renderToStaticMarkup(React.createElement(StackSessionView,{stack:learningStacks[0],session:{...blankSession(),step:4,seen:[0,1,2,3],completedAt:100},busy:false,onAction:async()=>true,onExit(){},onRelated(){}}));
 assert.match(html,/Skipped/);assert.match(html,/Not attempted/);assert.match(html,/Done for now/);assert.doesNotMatch(html,/1 \/ 1 correct|Mastered/);
});

test("rescheduled recall asks a fresh question without revealing the earlier answer",async()=>{
 const {StackRecall}=await vite.ssrLoadModule("/app/stack-session.tsx");
 const {learningStacks,blankSession}=await vite.ssrLoadModule("/app/stacks.ts");
 const html=renderToStaticMarkup(React.createElement(StackRecall,{stack:learningStacks[0],session:{...blankSession(),step:4,completedAt:100,recallAt:200,recallAnswer:1,reviewDue:300},busy:false,onAction:async()=>true}));
 assert.match(html,/Check recall/);assert.doesNotMatch(html,/Best answer:|Recalled correctly/);
});


test("original explainers are real local videos with captions and no autoplay or third-party player",async()=>{
 const {ExplainerCard}=await vite.ssrLoadModule("/app/media-cards.tsx");
 const {explainers}=await vite.ssrLoadModule("/app/media-content.ts");
 for(const clip of explainers){
  const html=renderToStaticMarkup(React.createElement(ExplainerCard,{clip,saved:false,active:false,onActivate(){},onSave(){},onStack(){}}));
  assert.match(html,/<video[^>]*controls/);assert.match(html,/preload="none"/);assert.match(html,/<track[^>]*kind="captions"/);
  assert.match(html,/AI-authored animation/);assert.doesNotMatch(html,/<iframe|autoPlay|autoplay|src="https:\/\//);
  for(const asset of [clip.video,clip.poster,clip.captions])assert.ok((await readFile(path.join(root,'public',asset))).length>0);
  const transcript=JSON.parse(await readFile(path.join(root,'public',clip.video.replace('.mp4','.json')),'utf8'));
  assert.equal(clip.duration,transcript.duration_seconds);assert.equal(transcript.audio,false);assert.ok(clip.transcript.length>=7);
 }
});

test("mixed feed includes every format and resolves saved originals from the current catalog",async()=>{
 const {mixedFeed}=await vite.ssrLoadModule("/app/mixed-feed.ts");
 const {cards,curatedNews}=await vite.ssrLoadModule("/app/content.ts");
 const {videoCatalog,videoAsCard}=await vite.ssrLoadModule("/app/video-catalog.ts");
 const {quotes,mediaCards,resolveOriginalMedia}=await vite.ssrLoadModule("/app/media-content.ts");
 const {stateSchema,initialState}=await vite.ssrLoadModule("/app/learning.ts");
 const pool=[...videoCatalog.map(videoAsCard),...mediaCards(),...curatedNews,...cards];
 const result=mixedFeed(pool,[]);
 assert.deepEqual(result.slice(0,7).map(item=>item.kind),['video','quote','explainer','news','lesson','quiz','flashcard']);
 assert.equal(new Set(result.map(item=>item.id)).size,result.length);
 const tuned=mixedFeed(pool,[{topic:'Development',preference:'more'}]);assert.equal(tuned[0].topic,'Development');
 for(const quote of quotes){assert.ok(quote.quote.split(/\s+/).length<=25);assert.match(quote.source,/^https:\/\//);assert.ok(quote.author);}
 assert.equal(stateSchema.safeParse({...initialState,saved:mediaCards()}).success,true);
 const original=mediaCards()[0];assert.deepEqual(resolveOriginalMedia([{...original,title:'Tampered source',source:'https://attacker.example/'}]),[original]);
 assert.deepEqual(resolveOriginalMedia([{...original,id:'removed-quote'}]),[]);
 assert.ok(videoCatalog.filter(video=>video.format==='short').length>=6);
});
