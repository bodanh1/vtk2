"use strict";
// eqt: 1 đao, 2 côn, 3 thương, 4 chùy; ám khí 100 tiêu, 101 phi đao, 102 tụ tiễn.
const MOUNT_COMBAT_RULES={tianwang:{mastery:24,weapon:1},wudu:{mastery:60,weapon:1},shaolin:{mastery:6,weapon:1},tianren:{mastery:132,weapon:3}};
function mountWeaponType(state){const w=state&&state.eq&&state.eq.weapon;if(!w)return -1;return w.d===1?100+w.k:w.d===0?(w.k===6?-1:w.k):-1}
function mountEquipped(state){return !!(state&&state.eq&&state.eq.horse)}
function mountedAttackAllowed(state,attack){
  const rule=state&&MOUNT_COMBAT_RULES[state.fac];
  if(!rule||!mountEquipped(state)||mountWeaponType(state)!==rule.weapon)return false;
  if(rule.mastery&&!(state.sk&&state.sk[rule.mastery]>0))return false;
  if(!attack||!attack.id)return true;
  const skill=SK[attack.id];
  return !!(skill&&FAC[state.fac].skills.includes(skill.id)&&skill.eqt===rule.weapon);
}
function prepareMountedAttack(state,attack){
  if(state&&state.mounted&&(!mountEquipped(state)||!mountedAttackAllowed(state,attack))){state.mounted=false;return false}
  return !!(state&&state.mounted);
}

function preferredWeaponCode(state){
  const fac=state&&FAC[state.fac];if(!fac)return -1;
  const current=mountWeaponType(state),generic=current>=100?7:current===-1?9:current;
  const hasMastery=fac.skills.some(id=>{const s=SK[id],row=s&&s.attr&&s.attr.addphysicsdamage_p&&s.attr.addphysicsdamage_p[0];return state.sk&&state.sk[id]>0&&Array.isArray(row)&&row[2]===generic});
  return state.eq&&state.eq.weapon&&hasMastery?generic:fac.wcode;
}
