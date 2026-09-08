import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, server: { middlewareMode: true } });
after(() => vite.close());

test("every published preview layer and practice resolves to the existing catalog", async () => {
  const { stackCollections } = await vite.ssrLoadModule("/app/stack-collections.ts");
  const { cards } = await vite.ssrLoadModule("/app/content.ts");
  const { learningStacks } = await vite.ssrLoadModule("/app/stacks.ts");
  for (const stack of stackCollections) {
    assert.equal(new Set(stack.layers.map(layer => layer.topic)).size, stack.layers.length);
    for (const layer of stack.layers) for (const id of layer.cardIds) {
      const card = cards.find(item => item.id === id);
      assert.ok(card, `${stack.id}: missing ${id}`);
      assert.equal(card.topic, layer.topic, `${id}: incorrect layer`);
    }
    for (const id of stack.practiceIds) assert.ok(learningStacks.some(practice => practice.id === id), `Missing practice ${id}`);
  }
});

test("Stack discovery searches actual skills and includes the practice-specific references", async () => {
  const { stackCollections, collectionMatchesSearch, collectionSources, collectionPractice } = await vite.ssrLoadModule("/app/stack-collections.ts");
  assert.equal(collectionMatchesSearch(stackCollections[0], "DNS"), true);
  assert.equal(collectionMatchesSearch(stackCollections[1], "Git"), true);
  assert.equal(collectionMatchesSearch(stackCollections[1], "TypeScript"), true);
  assert.equal(collectionMatchesSearch(stackCollections[2], "overfitting"), true);
  assert.equal(collectionMatchesSearch(stackCollections[0], "unrelated-game-title"), false);
  for (const stack of stackCollections) {
    const sources = collectionSources(stack);
    assert.equal(new Set(sources.map(item => item.url)).size, sources.length);
    for (const practice of collectionPractice(stack)) for (const card of [practice.concept, practice.question, practice.recall]) {
      assert.ok(sources.some(source => source.url === card.source), `${stack.name}: omitted ${card.sourceName}`);
    }
  }
});
