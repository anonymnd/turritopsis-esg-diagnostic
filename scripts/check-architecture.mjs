import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(repo,'frontend/src');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const errors=[];let checked=0;
for(const file of walk(src).filter(p=>/\.tsx?$/.test(p))){
 const from=path.relative(src,file).replaceAll('\\','/');const owner=from.match(/^features\/([^/]+)\//)?.[1];
 const text=fs.readFileSync(file,'utf8');
 for(const match of text.matchAll(/(?:from\s*|import\s*\(|import\s*)["'](\.[^"']+)["']/g)){
  const spec=match[1];const target=path.relative(src,path.resolve(path.dirname(file),spec)).replaceAll('\\','/');checked++;
  const feature=target.match(/^features\/([^/]+)\/(.*)$/);
  if(from.startsWith('shared/')&&feature)errors.push(`${from}: shared code depends on feature ${feature[1]}`);
  if(owner&&target.startsWith('app/'))errors.push(`${from}: a feature depends on app composition`);
  if(feature&&feature[1]!==owner){
   const routePage=from.startsWith('app/routes/')&&feature[2].startsWith('pages/');
   if(feature[2]!=='index'&&feature[2]!=='index.ts'&&!routePage)errors.push(`${from}: import ${spec} through the feature index.ts`);
  }
 }
}
// Core projects cannot depend on web/database frameworks or infrastructure. Each adapter references only its own core.
const backend=path.join(repo,'backend/src');
const projects=walk(backend).filter(p=>p.endsWith('.csproj')&&!p.includes(path.sep+'obj'+path.sep));
for(const project of projects){
 const name=path.basename(project,'.csproj');const module=name.match(/^Turritopsis\.Modules\.([^.]+)\.(Core|Infrastructure)$/);const xml=fs.readFileSync(project,'utf8');
 if(!module)continue;
 const [,owner,part]=module;
 for(const ref of xml.matchAll(/<ProjectReference Include="([^"]+)"/g)){
  const target=path.basename(ref[1].replaceAll('\\','/'),'.csproj');
  const allowed=part==='Core'?['Turritopsis.SharedKernel',...(owner==='Reviews'?['Turritopsis.Modules.Ai.Core']:[])]:['Turritopsis.Modules.'+owner+'.Core'];
  if(!allowed.includes(target))errors.push(name+': forbidden project dependency '+target);
 }
 if(part==='Core'&&/<(?:PackageReference|FrameworkReference) Include="(?:Microsoft\.AspNetCore|Microsoft\.EntityFrameworkCore|Npgsql|Microsoft\.Extensions)/.test(xml))errors.push(name+': core depends on infrastructure framework');
 for(const file of walk(path.dirname(project)).filter(p=>p.endsWith('.cs')&&!p.includes(path.sep+'obj'+path.sep)&&!p.includes(path.sep+'bin'+path.sep))){
  const text=fs.readFileSync(file,'utf8');
  if(part==='Core'&&/using (Microsoft\.EntityFrameworkCore|Microsoft\.AspNetCore|Npgsql|Microsoft\.Extensions)/.test(text))errors.push(name+': framework import in '+path.basename(file));
  if(text.includes('TurritopsisDbContext'))errors.push(name+': accesses centralized migration context');
 }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Architecture boundaries passed: '+checked+' frontend imports and '+projects.length+' backend projects.');
