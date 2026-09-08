import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
const temp = mkdtempSync(join(process.cwd(), '.exam-test-'));
const sqlite = new DatabaseSync(':memory:');
for (const file of ['0002_lowly_radioactive_man.sql', '0003_ambiguous_marten_broadcloak.sql']) sqlite.exec(readFileSync(`drizzle/${file}`, 'utf8'));
after(() => { sqlite.close(); rmSync(temp, { recursive: true, force: true }); });
function compile(source, name) {
  let code = ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  code = code.replaceAll('"cloudflare:workers"', '"./env.mjs"');
  for (const name of ['catalog-records', 'content', 'stacks', 'stack-skins', 'video-server', 'personal-stacks', 'certification-catalog', 'certification-bank', 'exam-state']) for (const prefix of ['./', '../../']) code = code.replaceAll(`"${prefix}${name}"`, `"./${name}.mjs"`);
  writeFileSync(join(temp, name + '.mjs'), code);
}
writeFileSync(join(temp, 'env.mjs'), 'export const env={};');
for (const name of ['catalog-records', 'content', 'stacks', 'stack-skins', 'video-server', 'personal-stacks', 'certification-catalog', 'certification-bank', 'exam-state']) compile(`app/${name}.ts`, name);
compile('app/api/exam-attempts/route.ts', 'route');
const imp = name => import(pathToFileURL(join(temp, name + '.mjs')));
const { env } = await imp('env'); const route = await imp('route');
const { examTracks, examQuestionCount, examSetVersion } = await imp('certification-catalog');
const { examBanks } = await imp('certification-bank');
const { gradeExam } = await imp('exam-state');
let beforeUpdate = null;
function prepared(sql, args = []) { return { bind(...values) { return prepared(sql, values); }, async first() { return sqlite.prepare(sql).get(...args) ?? null; }, async all() { return { results: sqlite.prepare(sql).all(...args) }; }, async run() { if (beforeUpdate && sql.startsWith('UPDATE exam_attempts')) { const action = beforeUpdate; beforeUpdate = null; await action(); } return { meta: { changes: Number(sqlite.prepare(sql).run(...args).changes) } }; } }; }
const binding = { prepare: prepared };
beforeEach(() => { env.DB = binding; beforeUpdate = null; sqlite.exec("DELETE FROM exam_attempts; DELETE FROM stack_accounts; INSERT INTO stack_accounts VALUES ('owner','18plus-v1','self_attestation',1); INSERT INTO stack_accounts VALUES ('other','18plus-v1','self_attestation',1);"); });
function request(body, user = 'owner', id = '', origin = 'https://stackscroll.test') { return new Request('https://stackscroll.test/api/exam-attempts' + (id ? `?id=${id}` : ''), { method: body ? 'POST' : 'GET', headers: { ...(user ? { 'oai-authenticated-user-id': user } : {}), origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
const start = (examId = 'a-core-2') => ({ operation: 'start', id: crypto.randomUUID(), operationId: crypto.randomUUID(), examId });
const post = (body, user) => route.POST(request(body, user));
async function result(body, user) { const response = await post(body, user); const data = await response.json(); assert.equal(response.status, 200, JSON.stringify(data)); return data.attempt; }
const save = (attempt, edit = {}, submit = false) => ({ operation: 'save', id: attempt.id, operationId: crypto.randomUUID(), revision: attempt.revision, submit, edit: { answers: attempt.answers, flagged: attempt.flagged, index: attempt.index, ...edit } });
const read = async (id, user) => (await route.GET(request(null, user, id))).json();

test('all six original banks have eight coherent, source-linked questions with coverage and valid answer keys', () => {
  assert.equal(examTracks.length, 6); const ids = new Set();
  for (const track of examTracks) {
    const questions = examBanks[track.id]; assert.equal(questions.length, examQuestionCount);
    for (const domain of track.domains) assert.ok(questions.some(question => question.domain === domain), `${track.id}: missing ${domain}`);
    for (const question of questions) {
      assert.ok(!ids.has(question.id)); ids.add(question.id);
      assert.equal(question.options.length, 4); assert.equal(new Set(question.options).size, 4);
      assert.equal(question.correct.length, question.selectCount); assert.equal(new Set(question.correct).size, question.selectCount);
      assert.ok(question.correct.every(index => index >= 0 && index < question.options.length)); assert.ok(question.explanation.length > 30);
      assert.ok(track.domains.includes(question.domain)); assert.ok(question.sources.length);
      for (const source of question.sources) { const url = new URL(source.url); assert.equal(url.protocol, 'https:'); assert.ok(['learn.microsoft.com', 'support.microsoft.com', 'www.kingston.com', 'www.dell.com', 'www.koenig-solutions.com', 'www.rfc-editor.org', 'www.cisco.com', 'cloud.google.com', 'docs.cloud.google.com', 'developers.google.com'].includes(url.hostname)); }
    }
  }
  assert.equal(ids.size, 48);
  assert.match(examBanks['cloud-digital-leader'].find(question => question.id === 'g-budget').prompt, /alerts-only/);
});

test('scoring uses the full set and exact multi-select answers, with no partial credit or readiness label', () => {
  const questions = examBanks['a-core-2'];
  const data = { questions, answers: questions.map(() => []), flagged: [], index: 0 };
  assert.deepEqual(gradeExam(data), { correct: 0, total: 8, unanswered: 8, domains: [ { name: 'Operating systems', correct: 0, total: 2 }, { name: 'Security', correct: 0, total: 2 }, { name: 'Software troubleshooting', correct: 0, total: 2 }, { name: 'Operational procedures', correct: 0, total: 2 } ] });
  data.answers = questions.map(question => [...question.correct]); assert.equal(gradeExam(data).correct, 8);
  data.answers[7] = [0]; assert.equal(gradeExam(data).correct, 7); assert.equal(gradeExam(data).unanswered, 0);
  data.answers[7] = [0, 1, 2]; assert.equal(gradeExam(data).correct, 7);
});

test('API requires identity, same origin, valid fields, and an explicit age attestation', async () => {
  assert.equal((await route.GET(request(null, null))).status, 401);
  assert.equal((await post(start(), null)).status, 401);
  assert.equal((await route.POST(request(start(), 'owner', '', 'https://attacker.test'))).status, 403);
  assert.equal((await post(start(), 'unattested')).status, 403);
  assert.equal((await post({ ...start(), score: 100 })).status, 400);
  assert.equal((await post({ ...start(), user_id: 'other' })).status, 400);
  assert.equal((await post({ ...start(), extra: 'x'.repeat(9000) })).status, 400);
  assert.equal((await post(start('unknown'))).status, 404);
});

test('attempts resume with saved answers, position and flags; review keys stay hidden before submission', async () => {
  const body = start(); const attempt = await result(body);
  assert.equal(attempt.setVersion, examSetVersion); assert.equal(attempt.result, null);
  for (const question of attempt.questions) { assert.equal(question.review, undefined); assert.equal(question.correct, undefined); assert.equal(question.explanation, undefined); }
  assert.deepEqual(await result(body), attempt);
  const answers = attempt.answers.map((answer, index) => index === 0 ? [1] : answer);
  const edited = await result(save(attempt, { answers, index: 3, flagged: [3] }));
  assert.deepEqual((await read(attempt.id)).attempt, edited);
  const list = await read(); assert.equal(list.attempts.length, 1); assert.equal(list.attempts[0].questions, undefined); assert.equal(list.attempts[0].answered, 1);
  assert.deepEqual((await read(undefined, 'other')).attempts, []);
});

test('submission grades the pinned snapshot, reveals explanations once, and cannot be rewritten', async () => {
  const attempt = await result(start());
  const answers = examBanks['a-core-2'].map(question => [...question.correct]);
  const oldKey = examBanks['a-core-2'][0].correct;
  examBanks['a-core-2'][0].correct = [0];
  let finished;
  const command = save(attempt, { answers }, true);
  try { finished = await result(command); } finally { examBanks['a-core-2'][0].correct = oldKey; }
  assert.equal(finished.result.correct, 8); assert.ok(finished.submittedAt); assert.equal(finished.questions[0].review.correct[0], 1);
  assert.deepEqual(await result(command), finished);
  assert.equal((await post(save(finished, { answers: finished.answers.map(() => []) }))).status, 409);
  assert.equal((await post({ ...command, edit: { ...command.edit, index: 1 } })).status, 409);
  assert.equal((await read()).attempts[0].result.correct, 8);
});

test('cross-account requests and stale or concurrent edits never overwrite saved work', async () => {
  const attempt = await result(start());
  assert.equal((await route.GET(request(null, 'other', attempt.id))).status, 404);
  assert.equal((await post(save(attempt), 'other')).status, 404);
  assert.equal((await post({ ...start(), id: attempt.id }, 'other')).status, 409);
  assert.equal((await post({ operation: 'delete', id: attempt.id, revision: 1 }, 'other')).status, 404);
  const edited = await result(save(attempt, { index: 1 })); assert.equal((await post(save(attempt))).status, 409);
  beforeUpdate = async () => { await result(save(edited, { index: 2 })); };
  const raced = await post(save(edited, { index: 4 })); assert.equal(raced.status, 409);
  assert.equal((await read(attempt.id)).attempt.index, 2);
});

test('invalid choices cannot be persisted; deletion is scoped and storage failure remains visible', async () => {
  const attempt = await result(start());
  for (const patch of [{ answers: [] }, { index: 8 }, { flagged: [1, 1] }, { answers: attempt.answers.map((answer, index) => index === 0 ? [1, 2] : answer) }, { answers: attempt.answers.map((answer, index) => index === 0 ? [7] : answer) }]) assert.equal((await post(save(attempt, patch))).status, 422);
  const other = await result(start(), 'other');
  assert.equal((await post({ operation: 'delete', id: attempt.id, revision: 2 })).status, 409);
  assert.equal((await post({ operation: 'delete', id: attempt.id, revision: 1 })).status, 200);
  assert.equal((await read()).attempts.length, 0); assert.equal((await read(other.id, 'other')).attempt.id, other.id);
  env.DB = undefined; const old = console.error; console.error = () => {};
  try { assert.equal((await route.GET(request())).status, 503); assert.equal((await post(start())).status, 503); } finally { env.DB = binding; console.error = old; }
});

test('client output does not contain the server-only question bank or answer explanations', () => {
  function javascript(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? javascript(join(path, entry.name)) : entry.name.endsWith('.js') ? [join(path, entry.name)] : []); }
  const client = javascript('dist/client').map(path => readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(client, /a1-pair|np-private|cc-json|g-budget|az-guest/);
});
