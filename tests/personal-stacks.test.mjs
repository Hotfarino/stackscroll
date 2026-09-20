import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

const temp = mkdtempSync(join(process.cwd(), '.personal-stack-test-'));
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys = ON');
for (const file of ['0001_normal_wendigo.sql', '0002_lowly_radioactive_man.sql']) sqlite.exec(readFileSync(`drizzle/${file}`, 'utf8'));
after(() => { sqlite.close(); rmSync(temp, { recursive: true, force: true }); });
function compile(source, name) {
  let code = ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  for (const [from, to] of [['cloudflare:workers', './env.mjs'], ['./content', './content.mjs'], ['./catalog-records', './catalog-records.mjs'], ['./stacks', './stacks.mjs'], ['./stack-skins', './stack-skins.mjs'], ['../../video-server', './video-server.mjs'], ['../../personal-stacks', './personal-stacks.mjs']]) code = code.replaceAll('"' + from + '"', '"' + to + '"');
  writeFileSync(join(temp, name + '.mjs'), code);
}
writeFileSync(join(temp, 'env.mjs'), 'export const env={};');
for (const name of ['catalog-records','content', 'stacks', 'stack-skins', 'video-server', 'personal-stacks']) compile(`app/${name}.ts`, name);
compile('app/api/personal-stacks/route.ts', 'route');
const imp = name => import(pathToFileURL(join(temp, name + '.mjs')));
const { env } = await imp('env');
const route = await imp('route');
const { stackMix, aiInfrastructureStarter, emptyStack, stackDefinitionSchema, createEdition } = await imp('personal-stacks');
const { cards, coreCards } = await imp('content');
let beforeBatch = null;
let failAt = -1;
function prepared(sql, args = []) {
  return { bind(...values) { return prepared(sql, values); }, async first() { return sqlite.prepare(sql).get(...args) ?? null; }, async all() { return { results: sqlite.prepare(sql).all(...args) }; }, async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...args).changes) } }; } };
}
const binding = { prepare: prepared, async batch(statements) {
  if (beforeBatch) { const action = beforeBatch; beforeBatch = null; await action(); }
  sqlite.exec('BEGIN');
  try { const results = []; for (let index = 0; index < statements.length; index++) { if (index === failAt) throw new Error('Injected transaction failure'); results.push(await statements[index].run()); } sqlite.exec('COMMIT'); return results; }
  catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} };
beforeEach(() => { env.DB = binding; beforeBatch = null; failAt = -1; sqlite.exec('DELETE FROM personal_stacks; DELETE FROM stack_accounts; DELETE FROM stack_sessions; DELETE FROM topic_feedback;'); });
function request(body, user = 'owner', origin = 'https://stackscroll.test') { return new Request('https://stackscroll.test/api/personal-stacks', { method: body ? 'POST' : 'GET', headers: { ...(user ? { 'oai-authenticated-user-id': user } : {}), origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
const command = (operation = 'save', stackId = crypto.randomUUID(), revision = 0, definition = aiInfrastructureStarter()) => ({ operation, stackId, revision, definition, operationId: crypto.randomUUID() });
const post = (body, user) => route.POST(request(body, user));
const list = async (user) => (await route.GET(request(null, user))).json();
async function attest(user) { assert.equal((await post({ operation: 'attest', adult: true, policy: '18plus-v1' }, user)).status, 200); }
async function saved(body, user) { const response = await post(body, user); const data = await response.json(); assert.equal(response.status, 200, JSON.stringify(data)); return data.stack; }
const versions = id => sqlite.prepare('SELECT version,edition FROM personal_stack_versions WHERE stack_id=? ORDER BY version').all(id);

test('each new engagement-suggested topic can be saved and activated without altering other Stacks', async()=>{
 await attest('owner');
 for(const topic of ['Cybersecurity','Data engineering','DevOps','Web & accessibility','Mobile development','Robotics & IoT']){
  const definition={...emptyStack(),name:`${topic} Stack`,purpose:`Explore ${topic} through original source guides.`,layers:[{topic,emphasis:3}]};
  assert.ok(stackDefinitionSchema.safeParse(definition).success);
  const draft=await saved(command('save',crypto.randomUUID(),0,definition),'owner');
  const active=await saved(command('activate',draft.id,draft.revision,definition),'owner');
  assert.equal(active.active.contentIds.length,8);
  assert.ok(active.active.contentIds.every(id=>cards.find(c=>c.id===id)?.topic===topic));
 }
 assert.equal((await list('owner')).stacks.length,6);
});

test('topic emphasis controls early representation; visual ordering does not; the mix is finite and unique', () => {
  const definition = { name: 'Systems', purpose: 'Build reliable systems', layers: [{ topic: 'Agentic AI', emphasis: 3 }, { topic: 'Data centers', emphasis: 1 }], excludedIds: [] };
  const pool = definition.layers.flatMap(layer => Array.from({ length: 12 }, (_, i) => ({ id: `${layer.topic}-${i}`, topic: layer.topic })));
  const mix = stackMix(definition, [...pool, pool[0]]);
  assert.equal(mix.length, 24); assert.equal(new Set(mix.map(card => card.id)).size, 24);
  assert.equal(mix.slice(0, 12).filter(card => card.topic === 'Agentic AI').length, 9);
  assert.deepEqual(stackMix({ ...definition, layers: [...definition.layers].reverse() }, pool), mix);
  assert.equal(stackMix({ ...definition, excludedIds: [pool[0].id] }, pool).length, 23);
  const balanced = stackMix({ ...definition, layers: definition.layers.map(layer => ({ ...layer, emphasis: 1 })) }, pool);
  assert.equal(balanced.slice(0, 12).filter(card => card.topic === 'Agentic AI').length, 6);
});

test('starter definitions are independent and every layer has actual referenced material', () => {
  const first = aiInfrastructureStarter(); first.layers.pop();
  const next = aiInfrastructureStarter(); assert.equal(next.layers.length, 4);
  const edition = createEdition(next);
  assert.equal(edition.contentIds.length, new Set(edition.contentIds).size);
  for (const layer of next.layers) assert.ok(edition.contentIds.some(id => cards.find(card => card.id === id)?.topic === layer.topic));
  const dataCenterCards = coreCards.filter(card => card.topic === 'Data centers');
  assert.equal(dataCenterCards.length, 3);
  for (const card of dataCenterCards) assert.ok(['www.energystar.gov', 'docs.nvidia.com'].includes(new URL(card.source).hostname));
  assert.ok(edition.practiceIds.includes('agent-feedback')); assert.ok(edition.practiceIds.includes('ml-generalization'));
});

test('skins preserve the mix and practice; older definitions receive the original appearance', () => {
  const original = aiInfrastructureStarter();
  const legacy = { ...original }; delete legacy.skin;
  assert.equal(stackDefinitionSchema.parse(legacy).skin, 'prism');
  for (const skin of ['prism', 'ion', 'terminal', 'frost']) {
    const definition = stackDefinitionSchema.parse({ ...original, skin });
    assert.deepEqual(stackMix(definition), stackMix(original));
    assert.deepEqual(createEdition(definition).practiceIds, createEdition(original).practiceIds);
  }
  assert.equal(stackDefinitionSchema.safeParse({ ...original, skin: 'unapproved-style' }).success, false);
});

test('drafts allow incomplete work but schema and activation enforce topic, content, and naming rules', () => {
  assert.ok(stackDefinitionSchema.safeParse(emptyStack()).success);
  assert.throws(() => createEdition(emptyStack()), /name/);
  const valid = aiInfrastructureStarter();
  for (const definition of [ { ...valid, earned: true }, { ...valid, layers: [...valid.layers, valid.layers[0]] }, { ...valid, layers: [{ topic: 'Gaming', emphasis: 3 }] }, { ...valid, layers: [{ topic: 'Agentic AI', emphasis: 4 }] }, { ...valid, excludedIds: ['invented-card'] } ]) assert.equal(stackDefinitionSchema.safeParse(definition).success, false);
  const excludedIds = cards.filter(card => card.topic === 'Data centers').map(card => card.id);
  assert.throws(() => createEdition({ ...valid, excludedIds }), /every layer/);
});

test('API rejects anonymous, cross-origin, oversized and untrusted attributes, and requires explicit 18+ attestation', async () => {
  assert.equal((await route.GET(request(null, null))).status, 401);
  assert.equal((await route.POST(request(command(), null))).status, 401);
  assert.equal((await route.POST(request(command(), 'owner', 'https://attacker.test'))).status, 403);
  assert.equal((await post({ ...command(), extra: 'x'.repeat(9000) })).status, 400);
  assert.equal((await post({ ...command(), user_id: 'other' })).status, 400);
  assert.equal((await post(command())).status, 403);
  assert.equal((await post({ operation: 'attest', adult: false, policy: '18plus-v1' })).status, 400);
  assert.equal((await post({ operation: 'attest', adult: true, policy: 'obsolete' })).status, 400);
  await attest(); assert.equal((await list()).eligible, true);
  const row = sqlite.prepare('SELECT * FROM stack_accounts').get();
  assert.equal(row.age_method, 'self_attestation'); assert.ok(row.attested_at > 0); assert.equal(row.age_policy, '18plus-v1');
});

test('private drafts survive reload; activation is explicit; later draft saves preserve the active edition', async () => {
  await attest(); const create = command();
  const draft = await saved(create); assert.equal(draft.active, null); assert.equal(draft.revision, 1);
  assert.deepEqual((await list()).stacks[0], draft);
  assert.deepEqual((await list('other')).stacks, []);
  const active = await saved(command('activate', draft.id, 1)); assert.equal(active.activeVersion, 2);
  const edit = { ...active.draft, name: 'Changed draft', layers: [...active.draft.layers].reverse() };
  const later = await saved(command('save', draft.id, 2, edit));
  assert.equal(later.revision, 3); assert.equal(later.draft.name, 'Changed draft');
  assert.deepEqual(later.active, active.active); assert.equal(later.activeVersion, 2); assert.equal(versions(draft.id).length, 1);
  const updated = await saved(command('activate', draft.id, 3, edit));
  assert.equal(updated.activeVersion, 4); assert.equal(updated.active.definition.name, 'Changed draft');
  assert.equal(JSON.parse(versions(draft.id)[0].edition).definition.name, active.draft.name);
});

test('activation retries are idempotent and cannot reuse a request identifier for different content', async () => {
  await attest(); const create = command('activate');
  const first = await saved(create); const retry = await saved(create);
  assert.deepEqual(retry, first); assert.equal(versions(first.id).length, 1);
  assert.equal((await post({ ...create, definition: { ...create.definition, name: 'Different' } })).status, 409);
  assert.deepEqual((await list()).stacks[0], first);
});

test('a saved skin survives reload and old active editions normalize without false draft changes', async () => {
  await attest(); const definition = { ...aiInfrastructureStarter(), skin: 'terminal' };
  const active = await saved(command('activate', crypto.randomUUID(), 0, definition));
  assert.equal((await list()).stacks[0].active.definition.skin, 'terminal');
  const legacy = { ...active.draft }; delete legacy.skin;
  sqlite.prepare('UPDATE personal_stacks SET draft=? WHERE id=?').run(JSON.stringify(legacy), active.id);
  sqlite.prepare('UPDATE personal_stack_versions SET edition=? WHERE stack_id=?').run(JSON.stringify({ ...active.active, definition: legacy }), active.id);
  const loaded = (await list()).stacks[0];
  assert.equal(loaded.draft.skin, 'prism'); assert.deepEqual(loaded.draft, loaded.active.definition);
});

test('cross-account reads, edits, deletes and identifier collisions cannot expose or overwrite another Stack', async () => {
  await attest(); await attest('other'); const own = await saved(command('activate'));
  assert.equal((await post(command('save', own.id, own.revision), 'other')).status, 404);
  assert.equal((await post(command('activate', own.id, 0), 'other')).status, 409);
  assert.equal((await post({ operation: 'delete', stackId: own.id, revision: own.revision }, 'other')).status, 404);
  assert.deepEqual((await list('other')).stacks, []); assert.deepEqual((await list()).stacks[0], own);
});

test('stale edits and a real intervening save return conflict without creating an orphan edition', async () => {
  await attest(); const own = await saved(command('activate'));
  const stale = await post(command('save', own.id, 0)); assert.equal(stale.status, 409); assert.equal((await stale.json()).stack.revision, 1);
  beforeBatch = async () => { await saved(command('save', own.id, 1, { ...own.draft, name: 'Other tab' })); };
  const raced = await post(command('activate', own.id, 1)); assert.equal(raced.status, 409);
  const latest = (await list()).stacks[0]; assert.equal(latest.draft.name, 'Other tab'); assert.equal(latest.activeVersion, 1); assert.equal(versions(own.id).length, 1);
});

test('failed activation transaction rolls back the draft and never claims a successful save', async () => {
  await attest(); const own = await saved(command('activate')); const old = console.error; console.error = () => {};
  try { failAt = 1; assert.equal((await post(command('activate', own.id, 1, { ...own.draft, name: 'Fail this change' }))).status, 503); }
  finally { failAt = -1; console.error = old; }
  assert.deepEqual((await list()).stacks[0], own); assert.equal(versions(own.id).length, 1);
});

test('deletion requires the latest revision, cascades saved editions, and preserves separate practice and other accounts', async () => {
  await attest(); await attest('other'); const own = await saved(command('activate')); const other = await saved(command('activate'), 'other');
  sqlite.prepare('INSERT INTO stack_sessions (user_id,stack_id,data,revision,updated_at) VALUES (?,?,?,?,?)').run('owner', 'agent-feedback', '{}', 1, 10);
  assert.equal((await post({ operation: 'delete', stackId: own.id, revision: 2 })).status, 409);
  assert.equal((await post({ operation: 'delete', stackId: own.id, revision: 1 })).status, 200);
  assert.equal(versions(own.id).length, 0); assert.equal((await list()).stacks.length, 0);
  assert.equal((await list('other')).stacks[0].id, other.id); assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM stack_sessions').get().count, 1);
});

test('private Stack limit is account-scoped and storage failures remain visible', async () => {
  await attest(); for (let i = 0; i < 20; i++) await saved(command('save', crypto.randomUUID(), 0, emptyStack()));
  assert.equal((await post(command())).status, 409); assert.equal((await list()).stacks.length, 20);
  await attest('other'); await saved(command(), 'other');
  const old = console.error; console.error = () => {}; env.DB = undefined;
  try { assert.equal((await route.GET(request())).status, 503); assert.equal((await post(command())).status, 503); }
  finally { console.error = old; env.DB = binding; }
});

test('a catalog-sized customization crosses the old body limit and saves its exact finite edition', async () => {
  await attest('large-catalog-owner');
  const layers = [{ topic: 'Languages', emphasis: 3 }, { topic: 'Development', emphasis: 2 }];
  const selected = cards.filter(card => layers.some(layer => layer.topic === card.topic));
  const keep = new Set(layers.flatMap(layer => selected.filter(card => card.topic === layer.topic).slice(0, 3).map(card => card.id)));
  const definition = { ...emptyStack(), name: 'Small deliberate mix', purpose: 'Keep six ideas from the larger launch catalog.', layers, excludedIds: selected.filter(card => !keep.has(card.id)).map(card => card.id) };
  const operation = command('activate', crypto.randomUUID(), 0, definition);
  assert.ok(new TextEncoder().encode(JSON.stringify(operation)).length > 8192);
  const record = await saved(operation, 'large-catalog-owner');
  assert.deepEqual(new Set(record.active.contentIds), keep);
  assert.equal(record.draft.excludedIds.length, definition.excludedIds.length);
  const listed = await list('large-catalog-owner');
  assert.deepEqual(listed.stacks[0].active, record.active);
});
