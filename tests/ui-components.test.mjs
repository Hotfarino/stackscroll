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

test("flashcard texture keeps recall semantics and accessible fallback styling",async()=>{
 const {LearningCard}=await vite.ssrLoadModule('/app/learning-card.tsx');
 const {initialState}=await vite.ssrLoadModule('/app/learning.ts');
 const card={id:'texture-test',kind:'flashcard',topic:'Networking',level:'Foundation',title:'Recall a concept',back:'The answer',source:'https://example.com',sourceName:'Reference'};
 const html=renderToStaticMarkup(React.createElement(LearningCard,{card,state:initialState,onSave:()=>{},onComplete:()=>{},onAnswer:()=>{},onReview:()=>{}}));
 assert.match(html,/aria-label="Reveal answer"/);assert.match(html,/aria-expanded="false"/);
 const css=await readFile(path.join(root,'app/flashcard-texture.css'),'utf8');
 assert.match(css,/graphite-cyan-cracks.webp/);assert.match(css,/forced-colors:active/);assert.match(css,/focus-visible/);
 assert.doesNotMatch(css,/animation:|min-height:|padding:/);
 await readFile(path.join(root,'public/media/cards/graphite-cyan-cracks.webp'));
});

test("vector icons preserve dimensions without raster artwork or blur",async()=>{
 const {ReferenceIcon}=await vite.ssrLoadModule('/app/reference-icon.tsx');
 const names=['logo','discover','stacks','lab','radar','saved','search','profile','settings'];
 const html=renderToStaticMarkup(React.createElement('div',null,...names.map(name=>React.createElement(ReferenceIcon,{key:name,name,size:28}))));
 assert.doesNotMatch(html,/<image|<filter|feGaussianBlur/);
 assert.equal((html.match(/width="28" height="28"/g)||[]).length,names.length);
 const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.match(html,/viewBox="-2 -2 53 55"/);
});

test("reviewed feed images retain attribution, lazy loading and exact-work permission",async()=>{
 const {visualCards,reviewedFeedImage}=await vite.ssrLoadModule('/app/visual-content.ts');
 const {FeedImage}=await vite.ssrLoadModule('/app/feed-image.tsx');
 assert.equal(visualCards.length,11);
 for(const card of visualCards){
  const work=reviewedFeedImage(card);assert.ok(work);
  assert.equal(reviewedFeedImage({...card,source:'https://example.com/'}),undefined);
  await readFile(path.join(root,'public',work.src));
  const html=renderToStaticMarkup(React.createElement(FeedImage,{card,onOpen:()=>{}}));
  const escapedCredit=renderToStaticMarkup(React.createElement('span',null,work.credit)).slice(6,-7);
  assert.ok(html.includes(escapedCredit));assert.ok(html.includes(work.license));assert.match(html,/loading="lazy"/);
  assert.match(html,/width="960" height="540"/);assert.match(html,/Archive|Reference image/);assert.match(html,/<button/);
 }
 const withheld=renderToStaticMarkup(React.createElement(FeedImage,{card:{id:'rss-x',kind:'news',source:'https://example.com',newsImage:'https://example.com/unverified.jpg'}}));
 assert.equal(withheld,'');
 const plain=renderToStaticMarkup(React.createElement(FeedImage,{card:{id:'plain',kind:'lesson',topic:'Networking',source:'https://example.com'}}));
 assert.equal(plain,'','missing source images must not repeat generic artwork');
});

test("continuous loading prewarms at most three reviewed local images",async()=>{
 const {visualCards}=await vite.ssrLoadModule('/app/visual-content.ts');
 const {nextImageBatch,nextFeedLimit}=await vite.ssrLoadModule('/app/use-continuous-feed.ts');
 assert.equal(nextFeedLimit(6,8),8);assert.equal(nextFeedLimit(6,1000),12);
 const images=nextImageBatch(visualCards,0);assert.equal(images.length,3);
 assert.ok(images.every(src=>src.startsWith('/media/licensed/')));
 assert.deepEqual(nextImageBatch(visualCards,visualCards.length),[]);
});

test("saved-interest tuning preserves the rendered prefix and only reorders unread cards",async()=>{
 const {retuneTail}=await vite.ssrLoadModule('/app/feed-memory.ts');
 const cards=['a','b','c','d','e'].map(id=>({id}));
 const result=retuneTail(cards.map(c=>c.id),['a','c'],cards,tail=>tail.reverse());
 assert.deepEqual(result,['a','b','c','e','d']);
 assert.equal(new Set(result).size,cards.length);
 assert.deepEqual(retuneTail(result,result,cards,tail=>tail.reverse()),result);
});

test("workspace popout has an accessible closed trigger and reduced motion",async()=>{
 const {PopoutNavigation}=await vite.ssrLoadModule('/app/popout-navigation.tsx');
 const html=renderToStaticMarkup(React.createElement(PopoutNavigation,{items:[{id:'feed',label:'Discover',detail:'Fresh'}],view:'feed',onNavigate:()=>{throw Error('render must not navigate')}}));
 assert.match(html,/aria-label="Open workspace menu"/);
 assert.match(html,/aria-haspopup="menu"/);assert.match(html,/aria-expanded="false"/);
 const css=await readFile(path.join(root,'app/popout-navigation.css'),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/data-motion="reduced"/);
 assert.match(css,/forced-colors:active/);
});

test("catalog permission gates omit stale excerpts from rendered views", async()=>{
 const {catalogCards}=await vite.ssrLoadModule('/app/content.ts');
 const original=catalogCards.find(card=>card.catalog?.format==='repository');
 const card={...original,catalog:{...original.catalog,excerpt:'UNVERIFIED_EXCERPT_SENTINEL'}};
 const {CatalogCard}=await vite.ssrLoadModule('/app/catalog-card.tsx');
 const {FeedPreview}=await vite.ssrLoadModule('/app/feed-preview.tsx');
 const {RepositoryBrowser}=await vite.ssrLoadModule('/app/repository-browser.tsx');
 const noop=()=>{};
 const views=[
  React.createElement(CatalogCard,{card,saved:false,onSave:noop,onBuild:noop}),
  React.createElement(FeedPreview,{card,saved:false,blocked:false,onSave:noop,onToggle:noop}),
  React.createElement(RepositoryBrowser,{cards:[card],saved:[],query:'',onSave:noop,onBuild:noop})
 ];
 for(const view of views){const html=renderToStaticMarkup(view);assert.doesNotMatch(html,/UNVERIFIED_EXCERPT_SENTINEL/);assert.ok(html.includes(card.source));}
});

test("saved attribution renders original work, license and modifications",async()=>{
 const {licensedCards}=await vite.ssrLoadModule('/app/content.ts');
 const {ContentCredit}=await vite.ssrLoadModule('/app/content-credit.tsx');
 const card=JSON.parse(JSON.stringify(licensedCards[0]));
 const html=renderToStaticMarkup(React.createElement(ContentCredit,{card}));
 assert.match(html,/Philip Walton/);assert.match(html,/creativecommons.org\/licenses\/by\/4.0/);
 assert.match(html,/Condensed and rewritten/);assert.ok(html.includes(card.source));
});

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

test("feed loading state is labeled instead of rendering a blank card", async()=>{
 const source=await readFile(path.join(root,"app","stackscroll.tsx"),"utf8");
 assert.match(source,/role="status"/);assert.match(source,/Loading source-linked cards/);
 assert.doesNotMatch(source,/<Skeleton className="card-skeleton"\/>/);
});

test("video players make no embedded requests before a click and respect blocking and expiry", async () => {
  const { VideoCard } = await vite.ssrLoadModule("/app/video-card.tsx");
  const { videoCatalog, createPlaybackSession } = await vite.ssrLoadModule("/app/video-catalog.ts");
  const video = {...videoCatalog[0],thumbnail:{url:`/api/videos/thumbnail?id=${videoCatalog[0].id}`,width:480,height:360},rights:{...videoCatalog[0].rights,checkedAt:new Date(Date.now()-1000).toISOString(),recheckAfter:new Date(Date.now()+86400000).toISOString()}};
  const props={video,session:createPlaybackSession(),saved:false,blocked:false,active:false,onActivate(){},onUnload(){},onSave(){}};
  const render=extra=>renderToStaticMarkup(React.createElement(VideoCard,{...props,...extra}));
  const before=render({});
  assert.doesNotMatch(before,/<(?:iframe|script)\b/);
  const coverImages = [...before.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]);
  assert.ok(coverImages.length > 0);
  for (const image of coverImages) {
    assert.match(image,/src="\/api\/videos\/thumbnail\?id=video-dion-osi"/);
    assert.doesNotMatch(image,/https?:|srcSet=/i);
  }
  assert.doesNotMatch(before,/AI topic artwork/);
  assert.match(before,/YouTube thumbnail/);
  assert.doesNotMatch(render({blocked:true}),/<(?:img|iframe)\b/);
  assert.doesNotMatch(render({video:{...video,thumbnail:{...video.thumbnail,url:"https://attacker.example/image"}}}),/<img\b/);
  assert.match(before,/Load YouTube player/);
  assert.match(before,/Factual review pending/);
  assert.doesNotMatch(before,/Mark learned/);
  const after=render({active:true});
  assert.match(after,/<iframe[^>]+src="https:\/\/www.youtube-nocookie.com\/embed\//);
  assert.match(after,/referrerPolicy="strict-origin-when-cross-origin"/i);
  assert.match(after,/autoplay=1/);
  assert.match(after,/enablejsapi=1/);
  assert.match(after,/allow="autoplay;/);
  assert.doesNotMatch(render({active:true,blocked:true}),/<iframe\b/);
  assert.doesNotMatch(render({active:true,video:{...video,rights:{...video.rights,status:'revoked'}}}),/<iframe\b/);
});

test("YouTube embed errors distinguish disabled embeds without redirecting", async()=>{
 const {youtubePlaybackError}=await vite.ssrLoadModule("/app/video-card.tsx");
 assert.match(youtubePlaybackError(JSON.stringify({event:"onError",id:"player-1",info:150}),"player-1"),/disabled embedded playback/);
 assert.match(youtubePlaybackError({event:"onError",id:"player-1",info:100},"player-1"),/unavailable/);
 assert.equal(youtubePlaybackError({event:"onError",id:"another-player",info:150},"player-1"),null);
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
 assert.deepEqual(result.slice(0,11).map(item=>item.kind),['video','quote','story','explainer','news','lesson','quiz','podcast','flashcard','humor','resource']);
 assert.equal(new Set(result.map(item=>item.id)).size,result.length);
 const tuned=mixedFeed(pool,[{topic:'Development',preference:'more'}]);assert.equal(tuned[0].topic,'Development');
 for(const quote of quotes){assert.ok(quote.quote.split(/\s+/).length<=25);assert.match(quote.source,/^https:\/\//);assert.ok(quote.author);}
 assert.equal(stateSchema.safeParse({...initialState,saved:mediaCards()}).success,true);
 const original=mediaCards()[0];assert.deepEqual(resolveOriginalMedia([{...original,title:'Tampered source',source:'https://attacker.example/'}]),[original]);
 assert.deepEqual(resolveOriginalMedia([{...original,id:'removed-quote'}]),[]);
 assert.ok(videoCatalog.filter(video=>video.format==='short').length>=6);
});

test("podcast discovery uses official links without loading or rehosting audio",async()=>{
 const {EditorialCard}=await vite.ssrLoadModule("/app/editorial-card.tsx");
 const {editorialCards}=await vite.ssrLoadModule("/app/editorial-content.ts");
 for(const card of editorialCards.filter(item=>item.kind==='podcast')){
  const html=renderToStaticMarkup(React.createElement(EditorialCard,{card,saved:false,onSave(){}}));
  assert.ok(html.includes(card.source));assert.match(html,/Listen on/);assert.match(html,/Audio stays with the publisher/);assert.doesNotMatch(html,/<iframe|<audio|<video/);
 }
});

test("playlist data is bounded and the unopened playlist loads no media",async()=>{
 const {parsePlaylist,VideoPlaylist}=await vite.ssrLoadModule("/app/video-playlist.tsx");
 assert.deepEqual(parsePlaylist(JSON.stringify({name:"Network lab",ids:["a","a","b"]})),{name:"Network lab",ids:["a","b"]});
 for(const value of [null,{name:"x",ids:[{}]},{name:"x",ids:Array(101).fill("a")},{name:"x".repeat(81),ids:[]}])assert.throws(()=>parsePlaylist(JSON.stringify(value)));
 const html=renderToStaticMarkup(React.createElement(VideoPlaylist,{model:{list:{name:"Tech",ids:["original-dns"]},ready:true,notice:"",setList(){},clear(){}},videos:[],blocked:false,onOpen(){}}));
 assert.match(html,/Playlist \(1\)/);assert.doesNotMatch(html,/<iframe|<video|youtube.com\/iframe_api/);
});

test("content search matches multiple terms, creator names and original transcripts",async()=>{
 const {matchesSearch,cardMatchesSearch}=await vite.ssrLoadModule("/app/content-search.ts");
 const {cards}=await vite.ssrLoadModule("/app/content.ts");
 const {mediaCards}=await vite.ssrLoadModule("/app/media-content.ts");
 const {videoCatalog,videoAsCard}=await vite.ssrLoadModule("/app/video-catalog.ts");
 assert.equal(matchesSearch(" DNS  hostname ",["Hostname resolution uses DNS"]),true);
 assert.equal(matchesSearch("dns unrelatedword",["DNS"]),false);
 assert.equal(matchesSearch("   ",[]),true);
 assert.equal(matchesSearch("C++",["C++ programming"]),true);
 assert.ok(cards.some(card=>cardMatchesSearch(card,"DNS")));
 assert.ok(videoCatalog.some(v=>cardMatchesSearch(videoAsCard(v),"Dion Training",videoCatalog)));
 assert.ok(mediaCards().some(card=>cardMatchesSearch(card,"resolver cache")));
 assert.equal(matchesSearch("<script>",["safe text"]),false);
});

test("compact feed previews preserve source links and respect video thumbnail privacy",async()=>{
 const {FeedPreview}=await vite.ssrLoadModule("/app/feed-preview.tsx");
 const {coreCards}=await vite.ssrLoadModule("/app/content.ts");
 const {videoCatalog,videoAsCard}=await vite.ssrLoadModule("/app/video-catalog.ts");
 const render=(card,extra={})=>renderToStaticMarkup(React.createElement(FeedPreview,{card,blocked:false,saved:false,onSave(){},onToggle(){},...extra},React.createElement('span',null,'FULL_CONTENT_NOT_OPEN')));
 const native=render(coreCards[0]);assert.ok(native.includes(coreCards[0].source));assert.doesNotMatch(native,/FULL_CONTENT_NOT_OPEN|<iframe/);
 const v={...videoCatalog[0],thumbnail:{url:`/api/videos/thumbnail?id=${encodeURIComponent(videoCatalog[0].id)}`,width:480,height:360}};
 const card=videoAsCard(v);
 assert.match(render(card,{video:v}),/src="\/api\/videos\/thumbnail/);
 assert.doesNotMatch(render(card,{video:v,blocked:true}),/<img|<iframe/);
 assert.doesNotMatch(render(card,{video:{...v,thumbnail:{...v.thumbnail,url:'https://untrusted.example/image.jpg'}}}),/<img|<iframe/);
 assert.doesNotMatch(render(card),/<img|<iframe/);
});

test("catalog video previews request real thumbnails and suppress them when blocked", async () => {
 const {FeedPreview}=await vite.ssrLoadModule('/app/feed-preview.tsx');
 const {catalogCards}=await vite.ssrLoadModule('/app/content.ts');
 const card=catalogCards.find(card=>card.kind==='video'&&card.source.startsWith('https://youtu.be/'));
 const props={card,blocked:false,saved:false,onSave(){},onToggle(){},onPlay(){},children:null};
 const html=renderToStaticMarkup(React.createElement(FeedPreview,props));
 assert.match(html,/\/api\/catalog\/thumbnail\?id=/);
 assert.doesNotMatch(html,/src="https:\/\//);
 const blocked=renderToStaticMarkup(React.createElement(FeedPreview,{...props,blocked:true}));
 assert.doesNotMatch(blocked,/<img/);assert.match(blocked,/Preview blocked/);
});

test("catalog video cards load YouTube in place and retain an optional source link", async () => {
 const {CatalogCard}=await vite.ssrLoadModule('/app/catalog-card.tsx');
 const {catalogCards}=await vite.ssrLoadModule('/app/content.ts');
 const card=catalogCards.find(card=>card.kind==='video'&&card.source.startsWith('https://youtu.be/'));
 const props={card,blocked:false,saved:false,onSave(){},onBuild(){},onActivate(){},onUnload(){}};
 const idle=renderToStaticMarkup(React.createElement(CatalogCard,props));
 assert.match(idle,/aria-label="Open /);assert.match(idle,/Watch on YouTube \(optional\)/);
 assert.doesNotMatch(idle,/<iframe|youtube-nocookie\.com/);
 const active=renderToStaticMarkup(React.createElement(CatalogCard,{...props,active:true}));
 assert.doesNotMatch(active,/<iframe/);
});

test("repository browser exposes curated projects, search results and source links", async () => {
 const {RepositoryBrowser}=await vite.ssrLoadModule('/app/repository-browser.tsx');
 const {catalogCards}=await vite.ssrLoadModule('/app/content.ts');
 const props={cards:catalogCards,query:'',saved:[],onSave(){},onBuild(){}};
 const html=renderToStaticMarkup(React.createElement(RepositoryBrowser,props));
 assert.match(html,/GitHub Repos/);assert.match(html,/39 repositories/);assert.match(html,/https:\/\/github.com\/netbox-community\/netbox/);
 const filtered=renderToStaticMarkup(React.createElement(RepositoryBrowser,{...props,query:'netbox community'}));
 assert.match(filtered,/1 repositories/);assert.doesNotMatch(filtered,/href="https:\/\/github.com\/ansible/);
 const empty=renderToStaticMarkup(React.createElement(RepositoryBrowser,{...props,query:'no-such-repo-xyz'}));
 assert.match(empty,/No repositories match/);
});
