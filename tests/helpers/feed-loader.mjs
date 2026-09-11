import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
export async function loadFeed(){
 const temp=mkdtempSync(join(process.cwd(),'.stress-test-'));
 for(const name of ['catalog-records','content','mixed-feed','feed-memory']){
  const code=ts.transpileModule(readFileSync(`app/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/"\.\/(content|catalog-records)"/g,'"./$1.mjs"');writeFileSync(join(temp,name+'.mjs'),code);
 }
 const modules=await Promise.all(['content','mixed-feed','feed-memory'].map(name=>import(pathToFileURL(join(temp,name+'.mjs')))));
 return Object.assign({cleanup:()=>rmSync(temp,{recursive:true,force:true})},...modules);
}
