import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync('app/news.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {publisherImage,newsImageUrl,parseNews,newsSources}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const base='https://github.blog/changelog/article/';
test('publisher thumbnails support media, enclosures, HTML and escaped feed markup',()=>{
 assert.equal(publisherImage('<media:thumbnail url="https://cdn.example.org/a.jpg?a=1&amp;b=2"/>',base),'https://cdn.example.org/a.jpg?a=1&b=2');
 assert.equal(publisherImage('<enclosure type="image/webp" url="https://cdn.example.org/image"/>',base),'https://cdn.example.org/image');
 assert.equal(publisherImage('<description><![CDATA[<img src="/images/article.png">]]></description>',base),'https://github.blog/images/article.png');
 assert.equal(publisherImage('&lt;img src=&quot;https://cdn.example.org/image.jpg&quot;&gt;',base),'https://cdn.example.org/image.jpg');
});
test('missing, tracking, non-image enclosures and unsafe URLs stay text-only',()=>{
 for(const value of ['javascript:alert(1)','http://example.org/a.jpg','https://127.0.0.1/a','https://[::1]/a','https://localhost/a','https://host.internal/a','https://user:secret@example.org/a','https://example.org:8443/a',''])assert.equal(newsImageUrl(value),undefined);
 assert.equal(publisherImage('<enclosure type="audio/mpeg" url="https://example.org/audio.mp3"/><img width="1" src="https://example.org/pixel.gif">',base),undefined);
 assert.equal(publisherImage('<description>No image</description>',base),undefined);
});
test('news parsing preserves source and date without importing unverified publisher text or images',()=>{
 const date=new Date(Date.now()-60000).toISOString();
 const [card]=parseNews(`<rss><item><title>Release</title><link>${base}</link><pubDate>${date}</pubDate><description><![CDATA[Useful release notes <img src="https://cdn.example.org/article.jpg">]]></description></item></rss>`,newsSources[0]);
 assert.equal(card.kind,'news');assert.equal(card.source,base);assert.equal(card.date,date);
 assert.match(card.body,/excerpts are withheld/);assert.equal(card.newsImage,undefined);
});
test('header accents explicitly exclude news and thumbnail loading is lazy with failure fallback',()=>{
 const css=readFileSync('app/continuous-feed.css','utf8');
 assert.match(css,/kind-video,.kind-explainer,.kind-podcast,.kind-quote/);
 assert.match(css,/:not\(\.kind-news\)/);assert.match(css,/#C5A3FF/);
 const component=readFileSync('app/news-thumbnail.tsx','utf8');
 assert.match(component,/loading="lazy"/);assert.match(component,/failed===src\)return null/);assert.match(component,/referrerPolicy="no-referrer"/);
});
