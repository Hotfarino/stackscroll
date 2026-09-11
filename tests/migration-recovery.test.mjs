import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const stackSetup = readFileSync('drizzle/0002_lowly_radioactive_man.sql', 'utf8');
const originalStatements = stackSetup.replaceAll(' IF NOT EXISTS', '').split('--> statement-breakpoint');
const examSetup = readFileSync('drizzle/0003_ambiguous_marten_broadcloak.sql', 'utf8');

test('failed Stack setup resumes after every interrupted statement and permits exam setup', () => {
  for (let prefix = 0; prefix <= originalStatements.length; prefix++) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('PRAGMA foreign_keys = ON');
      for (const statement of originalStatements.slice(0, prefix)) db.exec(statement);
      db.exec(stackSetup);
      db.exec(stackSetup);
      db.exec(examSetup);
      for (const table of ['personal_stacks', 'personal_stack_versions', 'stack_accounts', 'exam_attempts']) {
        assert.ok(db.prepare('SELECT name FROM sqlite_schema WHERE type = ? AND name = ?').get('table', table), `${prefix}: ${table}`);
      }
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE type='index' AND name IN ('personal_stacks_user_updated','exam_attempts_user_updated')").get().n, 2);
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    } finally { db.close(); }
  }
});

test('retry keeps saved drafts, editions, ownership, and age confirmation intact', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys = ON');
    for (const statement of originalStatements) db.exec(statement);
    db.exec("INSERT INTO personal_stacks VALUES ('stack-1','owner','{\"name\":\"AI systems\"}',3,1,'op-1','hash-1',1,2)");
    db.exec("INSERT INTO personal_stack_versions VALUES ('stack-1',1,'owner','{\"contentIds\":[\"idea-1\"]}',1)");
    db.exec("INSERT INTO stack_accounts VALUES ('owner','18plus-v1','self_attestation',1)");
    const tables = ['personal_stacks', 'personal_stack_versions', 'stack_accounts'];
    const before = tables.map(table => db.prepare(`SELECT * FROM ${table}`).all());
    const schemaBefore = db.prepare("SELECT name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
    db.exec(stackSetup);
    assert.deepEqual(tables.map(table => db.prepare(`SELECT * FROM ${table}`).all()), before);
    assert.deepEqual(db.prepare("SELECT name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all(), schemaBefore);
    assert.throws(() => db.exec("INSERT INTO personal_stack_versions VALUES ('missing',1,'owner','{}',1)"), /FOREIGN KEY/);
    db.exec("DELETE FROM personal_stacks WHERE id='stack-1'");
    assert.equal(db.prepare('SELECT count(*) AS n FROM personal_stack_versions').get().n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM stack_accounts').get().n, 1);
  } finally { db.close(); }
});
