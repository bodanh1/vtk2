import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GAME as G} from '../gen/game.js';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../../ref.js',import.meta.url),'utf8'),ctx);const ref=ctx.window.REF;
function state(){const s=G.economyEngine.create({fac:'shaolin',mode:'g2',name:'Craft'});s.gold=1e8;s.mats.misc.wc=10;s.mats.misc.mys=10;return s;}
function item(s,row){G.setS(s);return G.makeSetItem('gold',row,0);}
const rows=G.J.sets.gold.filter(r=>ref.itemPairById[ref.setTemplateIds[JSON.stringify(G.setTemplateValues('gold',r))]]?.startsWith('plat:'));
test('five different gold templates are not two copies; failure consumes nothing',()=>{const s=state();s.inv=rows.slice(0,5).map(r=>item(s,r));const before=structuredClone(s),b={slots:[s,null,null],shared:{}};const r=G.economyEngine.context(b,0,Date.now(),null,()=>G.economyEngine.execute('makePlatina',[s.inv[0].uid,s.inv[1].uid],{}));assert.equal(r.result.ok,false);assert.equal(s.gold,before.gold);assert.deepEqual(s.inv,before.inv);assert.deepEqual(s.mats,before.mats);});
test('two legacy copies with missing refId remain eligible for platinum recipe',()=>{const s=state();s.inv=[item(s,rows[0]),item(s,rows[0])];for(const it of s.inv)delete it.refId;const b={slots:[s,null,null],shared:{}};const r=G.economyEngine.context(b,0,Date.now(),null,()=>G.economyEngine.execute('makePlatina',s.inv.map(it=>it.uid),{}));assert.equal(s.gold,1e8-300000);assert.ok(r.result.ok||r.result.lost);assert.equal(s.mats.misc.wc,9);assert.equal(s.mats.misc.mys,9);if(r.result.ok){assert.equal(s.inv.length,1);assert.equal(s.inv[0].set.kind,'platina');}else assert.equal(s.inv.length,2);});
