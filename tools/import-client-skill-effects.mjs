import fs from 'node:fs';
import vm from 'node:vm';
import {read,sprite,close} from './client-sprite.mjs';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('fx.js','utf8'),ctx);
const fx=ctx.window.JFX,decode=new TextDecoder('gbk');
const table=name=>{const rows=fs.readFileSync('../Client_VLTK_SHXT/settings/'+name,'latin1').split(/\r?\n/).map(l=>l.split('\t'));const header=rows.shift();return rows.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]||''])));};
const missiles=new Map(table('missles.txt').map(r=>[+r.MissleId,r]));
const prePaths=new Map(table('skills.txt').filter(r=>r.PreCastSpr).map(r=>[decode.decode(Buffer.from(r.PreCastSpr,'latin1')).toLowerCase(),r.PreCastSpr]));
fs.mkdirSync('fx/client',{recursive:true});
const cache=new Map,entries=[],missing=[];
function convert(label,old,source,info){
  const interval=Number((info||'').replaceAll('"','').split(',')[2])||0;
  const timing=per=>interval?{ms:Math.round(1000/18*interval*per/old.n)}:{};
  if(!source){missing.push({label,reason:'No source path'});return old;}
  const key=source+'|'+old.n;
  if(cache.has(key)){const native=cache.get(key);entries.push({label,...native.audit});return {...old,...native.sheet,...timing(native.audit.originalFrames)};}
  const resource=read(source,'latin1');
  if(!resource){missing.push({label,reason:'Not found in client PAK'});return old;}
  const file='fx/client/'+resource.id.toString(16)+'-'+old.n+'.png';
  const sheet=sprite(resource.data,file,{maxFrames:old.n});
  if(!sheet){missing.push({label,reason:'Empty sprite'});return old;}
  sheet.ax+=resource.data.readInt16LE(8)-160;sheet.ay+=resource.data.readInt16LE(10)-220;
  // Preserve H5 frame/direction budgets and timing; palette and alpha come directly from SPR.
  const native={f:file,n:sheet.n,d:sheet.d,w:sheet.w,h:sheet.h,ax:sheet.ax,ay:sheet.ay,ms:old.ms,blend:'source-over'};
  const audit={source:decode.decode(Buffer.from(source,'latin1')),pak:resource.pak,hash:resource.id,file,bytes:fs.statSync(file).size,frames:sheet.n,directions:sheet.d,originalFrames:sheet.per};
  cache.set(key,{sheet:native,audit});entries.push({label,...audit});return {...old,...native,...timing(sheet.per)};
}
try{
  for(const [id,m] of Object.entries(fx.m)){const row=missiles.get(+id);for(const [part,num] of [['fly',2],['hit',3],['end',4]])if(m[part])m[part]=convert('m'+id+'_'+part,m[part],row?.['AnimFile'+num]||(part==='hit'?row?.AnimFile4:''),row?.['AnimFileInfo'+(part==='hit'&&!row?.AnimFile3?4:num)]);}
  for(const [id,c] of Object.entries(fx.c))fx.c[id]=convert('c'+id,c,prePaths.get(c.p.toLowerCase()));
}finally{close();}
fs.writeFileSync('fx.js','window.JFX='+JSON.stringify(fx)+';\n');
const files=[...new Set(entries.map(e=>e.file))];
const report={entries,missing,uniqueFiles:files.length,totalBytes:files.reduce((sum,f)=>sum+fs.statSync(f).size,0)};
fs.writeFileSync('docs/client-skill-effects.json',JSON.stringify(report,null,2)+'\n');
console.log({converted:entries.length,missing:missing.length,uniqueFiles:files.length,totalMB:Math.round(report.totalBytes/1048576*100)/100});
