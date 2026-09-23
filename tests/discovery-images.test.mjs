import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
const manifest=JSON.parse(await readFile('public/media/licensed/DISCOVERY-RIGHTS.json','utf8'));
test('each distinct discovery image has exact-work provenance and commercial-compatible terms',()=>{
 assert.equal(manifest.items.length,16);
 assert.equal(new Set(manifest.items.map(x=>x.source)).size,16);
 for(const x of manifest.items){
  assert.ok(x.creator&&x.evidence&&x.alt&&x.changes);
  assert.match(x.license,/^(CC BY(?:-SA)? [234]\.0|CC0 1\.0|Public domain \(US\))$/);
  assert.match(x.source,/^https:\/\//);assert.match(x.original,/^https:\/\//);assert.match(x.licenseUrl,/^https:\/\//);
 }
});
test('all shipped images decode, remain bounded in size, and have distinct pixels',async()=>{
 const signatures=new Set();
 for(const x of manifest.items){
  const file=await readFile(`public/media/licensed/${x.key}.webp`),meta=await sharp(file).metadata();
  assert.equal(meta.format,'webp');assert.ok(meta.width<=1200&&meta.height<=1200);assert.ok(file.length<550000,x.key);
  const thumb=await sharp(file).resize(32,32).raw().toBuffer();signatures.add(thumb.toString('base64'));
 }
 assert.equal(signatures.size,16);
});
