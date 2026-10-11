import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {read,sprite,close} from './client-sprite.mjs';
import {read as readPng,png} from './mount-png.mjs';
const table=name=>fs.readFileSync('../Client_VLTK_SHXT/settings/'+name,'latin1').split(/\r?\n/).filter(Boolean).map(r=>r.split('\t'));
const ctx={window:{}};for(const f of ['data.js','world.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
const skills=table('skills.txt'),sh=skills.shift(),states=table('npcres/×´Ì¬Í¼ÐÎ¶ÔÕÕ±í.txt');states.shift();
const buffs={},audit=[],cache=new Map;
fs.mkdirSync('fx/buffs',{recursive:true});fs.mkdirSync('img/a',{recursive:true});
try{
 for(const faction of Object.values(ctx.window.JX.factions))for(const id of faction.skills){
  const skill=ctx.window.JX.skills[id],row=skills.find(r=>+r[sh.indexOf('SkillId')]===id),state=+row?.[sh.indexOf('StateSpecialId')];
  if(!skill||skill.enemy||!state)continue;
  const sr=states.find(r=>r[0]==='Status'+state);if(!sr||sr[1]==='Special')continue;
  let sheet=cache.get(sr[1]);if(!sheet){const resource=read(sr[1],'latin1');if(!resource)throw Error('Missing buff '+id);
   const file='fx/buffs/'+resource.id.toString(16)+'.png',s=sprite(resource.data,file,{maxFrames:8});
   s.ax+=resource.data.readInt16LE(8)-160;s.ay+=resource.data.readInt16LE(10)-220;
   // State table interval is a complete cycle in 18 game ticks per second.
   sheet={f:file,w:s.w,h:s.h,ax:s.ax,ay:s.ay,n:s.n,d:s.d,ms:Math.round((+sr[8]||18)*1000/18/s.n),blend:'source-over',type:sr[2],backStart:+sr[4],backEnd:+sr[5],originalFrames:+sr[6]||s.per};
   cache.set(sr[1],sheet);audit.push({kind:'buff',state,source:new TextDecoder('gbk').decode(Buffer.from(sr[1],'latin1')),pak:resource.pak,...sheet,bytes:fs.statSync(file).size});
  }buffs[id]={...sheet,priority:+row[sh.indexOf('StatePriority')]||0};
 }
 const rows=table('npcres/ÆÕÍ¨npc×ÊÔ´.txt'),h=rows.shift(),masks=JSON.parse(fs.readFileSync('docs/client-masks.json','utf8')),used=new Set(masks.items.map(x=>x.key));
 const bosses=[];for(const key of ['boss129','boss130','boss131','boss132','boss133','boss134']){
  if(used.has(key)||ctx.window.JW.anim[key])throw Error('Already ported '+key);
  const r=rows.find(r=>r[0]===key),anim={};for(const [act,col]of Object.entries({st:'FightStand',run:'NormalRun',at:'Attack1',hurt:'Wound',die:'Die'})){
   const source='\\'+path.win32.normalize('spr\\npcres\\boss\\'+key+'\\'+r[h.indexOf(col)]),resource=read(source);if(!resource)throw Error('Missing boss '+source);
   const file='img/a/'+key+'-'+act+'.png',s=sprite(resource.data,file,{maxFrames:6});const cx=resource.data.readInt16LE(8),cy=resource.data.readInt16LE(10),fallback=!cx&&!cy&&resource.data.readUInt16LE(4)>160;
   s.ax+=(fallback?160:cx)-160;s.ay+=(fallback?192:cy)-220;
   anim[act]={f:path.basename(file),w:s.w,h:s.h,ax:s.ax,ay:s.ay,n:s.n,d:s.d,ms:Math.round(s.per*(s.interval||1)*1000/18/s.n),s:1};
   audit.push({kind:'boss',key,act,source,pak:resource.pak,originalFrames:s.per,...anim[act],file,bytes:fs.statSync(file).size});
  }bosses.push({key,anim});
 }
 fs.writeFileSync('js/client-activity-data.js','window.JCLIENT_ACTIVITY='+JSON.stringify({buffs,bosses})+';\n');
 fs.writeFileSync('docs/client-buffs-bosses.json',JSON.stringify({audit,totalBytes:audit.reduce((n,x)=>n+x.bytes,0)},null,2));
 const width=960,height=240,rgba=Buffer.alloc(width*height*4);bosses.forEach((b,i)=>{const s=b.anim.st,im=readPng('img/a/'+s.f);for(let y=0;y<s.h&&y<height;y++)for(let x=0;x<s.w&&x<160;x++)im.rgba.copy(rgba,(y*width+i*160+x)*4,(y*im.w+x)*4,(y*im.w+x)*4+4)});fs.writeFileSync('docs/client-boss-preview.png',png(width,height,rgba));
 console.log({buffs:Object.keys(buffs).length,bosses:bosses.length,MB:audit.reduce((n,x)=>n+x.bytes,0)/1048576});
}finally{close();}
