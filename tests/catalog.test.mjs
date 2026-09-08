import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const temp = mkdtempSync(join(process.cwd(), '.catalog-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));
const modules = ['catalog-records', 'content', 'learning', 'mixed-feed', 'editorial-content', 'media-content', 'video-catalog', 'content-search'];
for (const name of modules) {
  let code = ts.transpileModule(readFileSync(`app/${name}.ts`, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  for (const dependency of modules) code = code.replaceAll(`"./${dependency}"`, `"./${dependency}.mjs"`);
  writeFileSync(join(temp, `${name}.mjs`), code);
}
const load = name => import(pathToFileURL(join(temp, `${name}.mjs`)));
const { catalogCards, cards, resolveCatalogSaved } = await load('content');
const { eligibleCard, mixedFeed } = await load('mixed-feed');
const { stateSchema, initialState, quizScore, isDue } = await load('learning');
const { resolveEditorialMedia } = await load('editorial-content');
const { resolveOriginalMedia } = await load('media-content');
const { resolveSavedVideos } = await load('video-catalog');
const { cardMatchesSearch } = await load('content-search');

test('the shipped edition contains 1,000 distinct usable entries and matches its audit manifest', () => {
  const manifest = JSON.parse(readFileSync('data/catalog/launch-1000.json', 'utf8'));
  const checks = JSON.parse(readFileSync('data/catalog/source-checks.json', 'utf8'));
  assert.deepEqual(catalogCards, manifest);
  assert.equal(catalogCards.length, 1000);
  assert.equal(new Set(catalogCards.map(card => card.id)).size, 1000);
  const external = catalogCards.filter(card => card.catalog.delivery === 'source');
  assert.equal(external.length, 880);
  assert.equal(new Set(external.map(card => card.source)).size, 880);
  assert.equal(new Set(checks.map(check => check.id)).size, 1000);
  for (const card of catalogCards) {
    assert.ok(eligibleCard(card), card.id);
    assert.ok(checks.some(check => check.id === card.id && check.source === card.source && check.checkedAt === card.catalog.checkedAt));
    assert.ok(Date.parse(card.catalog.checkedAt) <= Date.now());
    assert.doesNotMatch(card.title, /^(LLM Course|The Rust Programming Language|Automated traffic detection|llms\.txt|Colophon|Preface)$/);
    if (card.catalog.delivery === 'source') {
      assert.equal(card.catalog.rights, 'link-only');
      assert.equal(card.catalog.review, 'publisher-linked');
      assert.ok(card.catalog.prompt.length > 50);
    }
  }
  assert.equal(catalogCards.filter(card => card.kind === 'video').length, 50);
  assert.equal(catalogCards.filter(card => card.kind === 'humor').length, 40);
});

test('all launch bookmarks survive storage parsing and canonical rehydration, including external videos and podcasts', () => {
  const parsed = stateSchema.parse({ ...initialState, saved: catalogCards });
  const other = saved => resolveEditorialMedia(resolveOriginalMedia(resolveSavedVideos(saved, [])));
  const restored = resolveCatalogSaved(parsed.saved, other);
  assert.deepEqual(restored, catalogCards);
  const video = catalogCards.find(card => card.kind === 'video');
  assert.deepEqual(resolveCatalogSaved([{ ...video, source: 'https://attacker.example/', title: 'Changed' }], other), [video]);
  assert.deepEqual(resolveCatalogSaved([{ ...video, id: 'catalog-removed-item' }], other), []);
});

test('source discovery and humor do not become quiz credit or flashcard recall', () => {
  const discoveries = catalogCards.filter(card => !['quiz', 'flashcard'].includes(card.kind));
  const consumed = { ...initialState, done: Object.fromEntries(discoveries.map(card => [card.id, '2026-09-08'])) };
  assert.deepEqual(quizScore(consumed), { total: 0, correct: 0 });
  assert.ok(discoveries.every(card => !isDue(card, consumed)));
  for (const quiz of catalogCards.filter(card => card.kind === 'quiz')) {
    assert.equal(quiz.options.length, 4);
    assert.equal(new Set(quiz.options).size, 4);
    assert.ok(quiz.options[quiz.answer]);
    assert.ok(quiz.explanation.length > 80);
  }
});

test('search includes creator attribution, formats, and topic connections', () => {
  const video = catalogCards.find(card => card.kind === 'video');
  const humor = catalogCards.find(card => card.kind === 'humor');
  assert.ok(cardMatchesSearch(video, 'StatQuest video'));
  assert.ok(cardMatchesSearch(humor, 'memes'));
  assert.ok(cards.some(card => cardMatchesSearch(card, 'data centers')));
  assert.ok(cards.some(card => cardMatchesSearch(card, 'AI agents')));
  assert.equal(cardMatchesSearch(video, 'unrelated-gaming-title'), false);
});

test('the large feed stays unique and distributes scarce formats beyond its opening cards', () => {
  const feed = mixedFeed(catalogCards, []);
  assert.equal(feed.length, 1000);
  assert.equal(new Set(feed.map(card => card.id)).size, 1000);
  for (let start = 0; start < 1000; start += 250) {
    const section = feed.slice(start, start + 250);
    for (const kind of ['humor', 'quiz', 'flashcard', 'podcast', 'video', 'resource']) assert.ok(section.some(card => card.kind === kind), `${kind} absent from quarter ${start}`);
  }
});
