import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

const temp = mkdtempSync(join(process.cwd(), '.video-test-'));
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync('drizzle/0000_hesitant_xorn.sql','utf8'));
after(()=>{sqlite.close();rmSync(temp,{recursive:true,force:true});});
function compile(source,name) {
 const code = ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText
  .replaceAll('"cloudflare:workers"','"./env.mjs"').replaceAll('"../../video-server"','"./video-server.mjs"').replaceAll('"../../video-catalog"','"./video-catalog.mjs"');
 writeFileSync(join(temp,name+'.mjs'),code);
}
writeFileSync(join(temp,'env.mjs'),'export const env = {};');
compile('app/video-catalog.ts','video-catalog');compile('app/video-server.ts','video-server');
for(const route of ['videos','reports','moderation'])compile(`app/api/${route}/route.ts`,route);
const imp = name=>import(pathToFileURL(join(temp,name+'.mjs')));
const {env} = await imp('env');
const {videoCatalog,canEmbed,embedUrl,resolveSavedVideos,videoAsCard} = await imp('video-catalog');
const videos = await imp('videos');const reports = await imp('reports');const moderation = await imp('moderation');
const {readBody} = await imp('video-server');
const binding = {prepare(sql){return {bind(...args){const stmt=sqlite.prepare(sql);return {async run(){const result=stmt.run(...args);return {meta:{changes:Number(result.changes)}};},async all(){return {results:stmt.all(...args)};}};},async all(){return {results:sqlite.prepare(sql).all()};}};}};
env.DB=binding;
const now = Date.now();
for(const video of videoCatalog){video.rights.checkedAt=new Date(now-60000).toISOString();video.rights.recheckAfter=new Date(now+86400000).toISOString();}
const video = videoCatalog[0];
function request(path,body,{user='learner',email='learner@example.org',origin='https://stackscroll.test'}={}) {
 const headers={'Content-Type':'application/json'};
 if(user)headers['oai-authenticated-user-id']=user;
 if(email)headers['oai-authenticated-user-email']=email;
 if(origin)headers.origin=origin;
 return new Request('https://stackscroll.test'+path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})});
}
const report = {videoId:video.id,category:'privacy',details:'A private email address is visible at 01:30.'};

test('permission checks fail closed for expiry, revocation, stale review and unsafe IDs',()=>{
 assert.equal(canEmbed(video,now),true);
 assert.ok(embedUrl(video,now).startsWith('https://www.youtube-nocookie.com/embed/'));
 for(const rights of [{status:'revoked'},{status:'pending'},{recheckAfter:new Date(now).toISOString()},{expiresAt:new Date(now-1).toISOString()},{checkedAt:'invalid'},{canEdit:true}]) {
  const changed={...video,rights:{...video.rights,...rights}};
  assert.equal(canEmbed(changed,now),false);assert.equal(embedUrl(changed,now),null);
 }
 assert.equal(canEmbed({...video,youtubeId:'../../evil'},now),false);
 assert.equal(canEmbed({...video,sourceUrl:'https://attacker.example/'},now),false);
});

test('saved videos resolve against the current catalog and cannot retain a removed or altered source',()=>{
 const saved={...videoAsCard(video),source:'https://attacker.example/',title:'Altered title'};
 assert.deepEqual(resolveSavedVideos([saved],[]),[]);
 assert.deepEqual(resolveSavedVideos([saved],[video]),[videoAsCard(video)]);
});

test('report queue enforces authentication, same-origin writes, validation and durable rate limits',async()=>{
 assert.equal((await reports.POST(request('/api/reports',report,{user:null}))).status,401);
 assert.equal((await reports.POST(request('/api/reports',report,{origin:'https://attacker.example'}))).status,403);
 assert.equal((await reports.POST(request('/api/reports',{...report,videoId:'not-curated'}))).status,400);
 assert.equal((await reports.POST(request('/api/reports',{...report,details:'short'}))).status,400);
 assert.equal((await reports.POST(request('/api/reports',{...report,details:'x'.repeat(9000)}))).status,400);
 for(let i=0;i<10;i++)assert.equal((await reports.POST(request('/api/reports',report))).status,201);
 assert.equal((await reports.POST(request('/api/reports',report))).status,429);
 const stored=sqlite.prepare('SELECT * FROM content_reports').all();
 assert.equal(stored.length,10);assert.equal(stored[0].details,report.details);
 assert.equal('email' in stored[0],false);assert.equal('ip_address' in stored[0],false);
});

test('bounded parser rejects oversized bodies without a Content-Length header',async()=>{
 const req=new Request('https://stackscroll.test/api/reports',{method:'POST',body:JSON.stringify({details:'x'.repeat(8500)})});
 assert.equal(req.headers.has('content-length'),false);
 await assert.rejects(()=>readBody(req),/too large/);
});

test('moderation is owner-only and hidden videos cannot be played from the catalog',async()=>{
 const admin={user:'moderator',email:'bigdawgroof@gmail.com'};
 assert.equal((await moderation.GET(request('/api/moderation'))).status,403);
 assert.equal((await moderation.POST(request('/api/moderation',{videoId:video.id,action:'hide'}))).status,403);
 assert.equal((await moderation.POST(request('/api/moderation',{videoId:video.id,action:'hide'},admin))).status,200);
 let catalog=await (await videos.GET()).json();assert.equal(catalog.items.some(item=>item.id===video.id),false);
 assert.equal((await moderation.POST(request('/api/moderation',{videoId:video.id,action:'restore'},admin))).status,200);
 catalog=await (await videos.GET()).json();assert.equal(catalog.items.some(item=>item.id===video.id),true);
 const oldStatus=video.rights.status;video.rights.status='revoked';
 assert.equal((await moderation.POST(request('/api/moderation',{videoId:video.id,action:'restore'},admin))).status,409);video.rights.status=oldStatus;
 const id=sqlite.prepare('SELECT id FROM content_reports LIMIT 1').get().id;
 assert.equal((await moderation.POST(request('/api/moderation',{videoId:video.id,action:'resolve',reportId:id},admin))).status,200);
 assert.equal(sqlite.prepare('SELECT status FROM content_reports WHERE id=?').get(id).status,'resolved');
 assert.equal((await moderation.POST(request('/api/moderation',{videoId:video.id,action:'delete',reportId:id},admin))).status,200);
 assert.equal(sqlite.prepare('SELECT id FROM content_reports WHERE id=?').get(id),undefined);
});

test('storage failure never bypasses takedowns or pretends a report was saved; uploads are rejected',async()=>{
 env.DB=undefined;
 assert.equal((await videos.GET()).status,503);
 assert.equal((await reports.POST(request('/api/reports',report))).status,503);
 assert.equal((await videos.POST()).status,405);
 env.DB=binding;
});

test('explicit unload invalidates pending loads and a replaced source needs a fresh click',async()=>{
 const {createPlaybackSession,videoIdentity}=await imp('video-catalog');
 const session=createPlaybackSession();
 const pending=session.capture(video);
 assert.equal(session.permits(pending,video),true);
 session.revoke();
 assert.equal(session.permits(pending,video),false);
 const fresh=session.capture(video);
 const replaced={...video,youtubeId:videoCatalog[1].youtubeId,sourceUrl:videoCatalog[1].sourceUrl};
 assert.notEqual(videoIdentity(video),videoIdentity(replaced));
 assert.equal(session.permits(fresh,replaced),false);
 assert.equal(session.permits(fresh,video),true);
});

test('privacy requests stay available when all videos are hidden and can be deleted by the moderator',async()=>{
 for(const item of videoCatalog)sqlite.prepare('INSERT OR REPLACE INTO video_moderation VALUES (?,?,?)').run(item.id,1,Date.now());
 assert.deepEqual((await (await videos.GET()).json()).items,[]);
 const response=await reports.POST(request('/api/reports',{videoId:'privacy-request',category:'privacy',details:'Please remove the report data referenced in my earlier submission.'},{user:'privacy-request-user'}));
 assert.equal(response.status,201);
 const {id}=await response.json();
 const deleted=await moderation.POST(request('/api/moderation',{videoId:'privacy-request',reportId:id,action:'delete'},{user:'moderator',email:'bigdawgroof@gmail.com'}));
 assert.equal(deleted.status,200);
 assert.equal(sqlite.prepare('SELECT id FROM content_reports WHERE id=?').get(id),undefined);
});
