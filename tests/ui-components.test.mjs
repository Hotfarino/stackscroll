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
