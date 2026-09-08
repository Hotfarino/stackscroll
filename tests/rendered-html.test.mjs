import assert from "node:assert/strict";
import test, {after} from "node:test";
import { registerHooks } from "node:module";
// The built Worker imports Cloudflare's runtime binding API. The HTML test has
// no database requests, so supply an empty binding object under Node only.
const hooks=registerHooks({
 resolve(specifier,context,nextResolve){
  if(specifier==="cloudflare:workers")return {url:"data:text/javascript,export const env = {};",shortCircuit:true};
  return nextResolve(specifier,context);
 }
});
after(()=>hooks.deregister());

test("renders the Stackscroll application and its metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>Stackscroll/);
  assert.match(html, /Your daily mix/);
  assert.match(html, /brand-wordmark[^>]*>Stackscroll/);
  assert.match(html, /Customize your interface/);
  assert.match(html, /Tim Berners-Lee/);
  assert.match(html, /AI-authored animation/);
  assert.match(html, /Tune my feed/);
  assert.match(html, /Feed format/);
  assert.match(html, /\/media\/dns-in-motion.mp4/);
  assert.doesNotMatch(html, /5 today|Mark learned/);
  assert.doesNotMatch(html, /codex-preview/);
});
