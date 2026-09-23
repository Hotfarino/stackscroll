// Reproducible, manually reviewed asset import. Not a runtime scraper.
import {readFileSync,existsSync} from 'node:fs';
import {setTimeout as wait} from 'node:timers/promises';
import ts from 'typescript';
import sharp from 'sharp';
const code=ts.transpileModule(readFileSync('app/technology-visuals.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {technologyVisuals}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const work of technologyVisuals){
 if(existsSync(`public/media/licensed/${work.key}.webp`)){console.log(`${work.key}: already prepared`);continue;}
 await wait(2000);
 const request=()=>fetch(`https://upload.wikimedia.org/wikipedia/commons/${work.original}`,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'StackScrollAssetReview/1.0'}});
 let response=await request();
 if(response.status===429){const delay=Number(response.headers.get('retry-after')||30);if(!Number.isFinite(delay)||delay>60)throw Error('Image host asks for a longer pause; resume later.');await response.body?.cancel();console.log(`${work.key}: respecting image host retry delay`);await wait(Math.max(delay,5)*1000);response=await request();}
 if(!response.ok)throw Error(`${work.key}: HTTP ${response.status}`);
 if(!response.headers.get('content-type')?.startsWith('image/'))throw Error(`${work.key}: not an image`);
 const image=Buffer.from(await response.arrayBuffer());
 if(image.length>25*1024*1024)throw Error(`${work.key}: image exceeds import budget`);
 const info=await sharp(image).rotate().resize({width:960,withoutEnlargement:true}).webp({quality:82}).toFile(`public/media/licensed/${work.key}.webp`);
 console.log(`${work.key}: ${info.width}x${info.height}, ${Math.round(info.size/1024)} KB`);
}
