import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,ws:false}});
after(()=>vite.close());
const {matchesSearch,searchCards}=await vite.ssrLoadModule('/app/content-search.ts');
const {cards}=await vite.ssrLoadModule('/app/content.ts');
const {visualCards}=await vite.ssrLoadModule('/app/visual-content.ts');
const card=(id,title,extra={})=>({id,title,kind:'lesson',topic:'Development',level:'Foundation',source:'https://example.com/'+id,sourceName:'Original',...extra});
test('aliases expand whole concepts in both directions without dropping other words',()=>{
 for(const [a,b] of [['k8s','Kubernetes'],['a11y','Accessibility'],['ML','Machine learning'],['CI/CD','Continuous integration'],['RAG','Retrieval-augmented generation'],['wifi','Wi-Fi'],['3D printing','additive manufacturing']]){
  assert.ok(matchesSearch(a,[b]),a);assert.ok(matchesSearch(b,[a]),b);
 }
 assert.ok(matchesSearch('k8s deployment',['Kubernetes deployment']));
 assert.equal(matchesSearch('k8s bananas',['Kubernetes deployment']),false);
 assert.equal(matchesSearch('AI',['email domain']),false);
 assert.equal(matchesSearch('C++',['C# programming']),false);
 assert.equal(matchesSearch('C#',['C++ programming']),false);
});
test('normalization handles punctuation, plurals and bounded spelling errors',()=>{
 for(const [a,b] of [['netwroking','networking'],['kubernets','kubernetes'],['accessiblity','accessibility'],['batteries','battery'],['cafe','café'],['how to deploy','Deploy the app']])assert.ok(matchesSearch(a,[b]),a);
 assert.equal(matchesSearch('DNS',['DMS']),false);
 assert.equal(matchesSearch('zzzzzzzz',['security']),false);
 assert.equal(matchesSearch('!!!',['security']),false);
 assert.equal(matchesSearch('the and',['security']),false);
 assert.equal(matchesSearch('  ',[]),true);
});
test('results rank titles and curated keywords above body mentions without mutation',()=>{
 const input=[card('body','Another lesson',{body:'Kubernetes operations'}),card('tag','A deployment checklist',{keywords:['kubernetes']}),card('title','Kubernetes operations')];
 const original=JSON.stringify(input);
 assert.deepEqual(searchCards(input,'k8s').map(c=>c.id),['title','tag','body']);
 assert.equal(JSON.stringify(input),original);
 assert.equal(searchCards(input,''),input);
 assert.deepEqual(searchCards(input,'zzzzzzzz'),[]);
});
test('unreviewed cached excerpts and RSS body text cannot leak into search',()=>{
 const items=[card('catalog','Source',{catalog:{excerpt:'uniqueforbidden'}}),card('rss-test','News',{kind:'news',body:'uniqueforbidden'})];
 assert.deepEqual(searchCards(items,'uniqueforbidden'),[]);
});
test('actual library retrieves all six thinner topics using user-facing keywords',()=>{
 const cases=[['infosec','Cybersecurity'],['a11y','Web & accessibility'],['k8s','DevOps'],['ETL','Data engineering'],['android','Mobile development'],['iot','Robotics & IoT']];
 for(const [query,topic] of cases){const result=searchCards(cards,query);assert.ok(result.some(c=>c.topic===topic),query);assert.equal(new Set(result.map(c=>c.id)).size,result.length);}
 const start=performance.now();for(let i=0;i<20;i++)searchCards(cards,'kubernetes');
 assert.ok(performance.now()-start<3000,'20 cached searches should stay within a generous CI budget');
});
test('specific discovery queries find the intended image in the first three results',()=>{
 const library=[...cards,...visualCards];
 const cases=[['braille','discovery-braille'],['phone display','discovery-phone'],['OTP token','discovery-security'],['optical fiber','discovery-fiber'],['processor die','discovery-cpu'],['server rack','discovery-servers'],['3D printing wiring','discovery-printer-voron'],['parabolic antenna','discovery-antenna'],['tape archive','discovery-tape'],['lidar mapping','science-lidar-folsom'],['fluorescence cells','science-cos7-actin'],['titanium hand','science-printed-titanium-hand'],['water treatment','science-water-flocculation'],['coin cell','science-coin-cell-testing'],['Mars rover','science-perseverance-first-drive'],['Landsat ice','science-landsat-balkhash']];
 for(const [query,id]of cases)assert.ok(searchCards(library,query).slice(0,3).some(c=>c.id===`visual-${id}`),query);
});
test('expanded content offers a full lesson and valid knowledge check in every thinner topic',async()=>{
 const {discoveryCards}=await vite.ssrLoadModule('/app/content.ts');
 assert.equal(discoveryCards.length,12);
 for(const topic of ['Cybersecurity','Data engineering','DevOps','Web & accessibility','Mobile development','Robotics & IoT']){
  const lesson=discoveryCards.find(c=>c.topic===topic&&c.kind==='lesson'),quiz=discoveryCards.find(c=>c.topic===topic&&c.kind==='quiz');
  assert.ok(lesson.body.length>300);assert.ok(lesson.takeaway.length>40);
  assert.ok(quiz.options[quiz.answer]);assert.ok(quiz.explanation.length>40);
  assert.ok(visualCards.some(c=>c.topic===topic),topic);
 }
});
