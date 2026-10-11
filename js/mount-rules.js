"use strict";
// Direct client EqtLimit: -2 unrestricted, -1 unarmed, 0..99 melee, 100..199 ranged.
function mountWeaponType(state){const w=state&&state.eq&&state.eq.weapon;if(!w)return -1;return w.d===1?100+w.k:w.d===0?(w.k===6?-1:w.k):-1}
function mountEquipped(state){return !!(state&&state.eq&&state.eq.horse)}
function clientMountedSkillRule(attack){if(!attack||!attack.id)return[0,-2];const skill=SK[attack.id];if(!skill)return null;const data=window.JMOUNTSKILL;return data&&data[attack.id]||[0,skill.eqt??-2];}
function skillWeaponAllowed(state,attack){const rule=clientMountedSkillRule(attack);return !!(rule&&(rule[1]===-2||mountWeaponType(state)===rule[1]));}
function skillPostureAllowed(state,attack,mounted){const rule=clientMountedSkillRule(attack);if(!rule||!skillWeaponAllowed(state,attack))return false;return rule[0]===0||rule[0]===1&&!mounted||rule[0]===2&&mounted&&mountEquipped(state);}
function mountedAttackAllowed(state,attack){return mountEquipped(state)&&skillPostureAllowed(state,attack,true);}
function canPrepareSkillAttack(state,attack){const rule=clientMountedSkillRule(attack);return !!(rule&&skillWeaponAllowed(state,attack)&&(rule[0]===0||rule[0]===1||rule[0]===2&&state&&state.mounted&&mountEquipped(state)));}
function prepareSkillAttack(state,attack){if(!canPrepareSkillAttack(state,attack))return false;const rule=clientMountedSkillRule(attack);if(state.mounted&&(!mountEquipped(state)||rule[0]===1))state.mounted=false;return skillPostureAllowed(state,attack,!!state.mounted);}
function prepareMountedAttack(state,attack){prepareSkillAttack(state,attack);return !!(state&&state.mounted);}
function preferredWeaponCode(state){
 const fac=state&&FAC[state.fac];if(!fac)return -1;
 const genericOf=code=>code>=100?7:code===-1?9:code;
 const main=SK[state.main],rule=main&&clientMountedSkillRule({id:state.main});
 if(state.mainLock&&state.sk?.[state.main]>0&&fac.skills.includes(+state.main)&&isAttack(main)&&rule&&rule[1]!==-2)return genericOf(rule[1]);
 const current=mountWeaponType(state),generic=genericOf(current);
 const trained=fac.skills.some(id=>{const s=SK[id],row=s?.attr?.addphysicsdamage_p?.[0],r=clientMountedSkillRule({id});return state.sk?.[id]>0&&(Array.isArray(row)&&row[2]===generic||isAttack(s)&&r&&r[1]!==-2&&genericOf(r[1])===generic);});
 return state.eq?.weapon&&trained?generic:fac.wcode;
}
function preferredWeaponItem(state,item){
 const want=preferredWeaponCode(state);if(want>=0&&weaponCode({weapon:item})!==want)return false;
 const main=SK[state.main],rule=main&&clientMountedSkillRule({id:state.main});
 return !(state.mainLock&&state.sk?.[state.main]>0&&isAttack(main)&&rule&&rule[1]!==-2)||mountWeaponType({eq:{weapon:item}})===rule[1];
}
