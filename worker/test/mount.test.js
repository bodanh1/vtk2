import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GAME as G} from '../gen/game.js';
const context={SK:G.SK,FAC:G.FAC};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../../js/mount-rules.js',import.meta.url),'utf8')+';this.rules=MOUNT_COMBAT_RULES;',context);
test('cưỡi ngựa: bốn phái đúng nhánh, đúng vũ khí, có điểm võ công nền; Đường Môn hoãn',()=>{
 for(const fac of ['tianwang','shaolin','wudu','tianren']){
  const rule=context.rules[fac],s={fac,eq:{horse:{},weapon:{d:0,k:rule.weapon}},sk:{[rule.mastery]:1},mounted:true};
  const allowed=G.FAC[fac].skills.map(id=>G.SK[id]).filter(sk=>sk.enemy&&sk.eqt===rule.weapon);
  for(const sk of allowed)assert.equal(context.mountedAttackAllowed(s,{id:sk.id}),true,sk.n);
  const wrong=G.FAC[fac].skills.map(id=>G.SK[id]).find(sk=>sk.enemy&&sk.eqt!==rule.weapon);
  assert.equal(context.mountedAttackAllowed(s,{id:wrong.id}),false);context.prepareMountedAttack(s,{id:wrong.id});assert.equal(s.mounted,false);
  s.sk={};assert.equal(context.mountedAttackAllowed(s,{id:allowed[0].id}),false);
  s.sk[rule.mastery]=1;s.eq.weapon={d:0,k:rule.weapon===1?3:1};assert.equal(context.mountedAttackAllowed(s,{id:allowed[0].id}),false);
 }
 assert.equal(context.mountedAttackAllowed({fac:'tangmen',eq:{horse:{},weapon:{d:1,k:2}},sk:{43:1}},{id:302}),false);
});
test('cưỡi ngựa: tháo ngựa tự xuống, đánh thường đúng nhánh, tự mặc giữ vũ khí nhánh đã học',()=>{
 const s={fac:'shaolin',eq:{horse:{},weapon:{d:0,k:1}},sk:{6:1},mounted:true};
 assert.equal(context.mountedAttackAllowed(s,{id:0}),true);assert.equal(context.preferredWeaponCode(s),1);
 delete s.eq.horse;context.prepareMountedAttack(s,{id:0});assert.equal(s.mounted,false);
 s.eq.weapon={d:0,k:2};s.sk={4:1};assert.equal(context.preferredWeaponCode(s),2);
});
