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
function preferredWeaponCode(state){const fac=state&&FAC[state.fac];if(!fac)return -1;const current=mountWeaponType(state),generic=current>=100?7:current===-1?9:current;const hasMastery=fac.skills.some(id=>{const s=SK[id],row=s&&s.attr&&s.attr.addphysicsdamage_p&&s.attr.addphysicsdamage_p[0];return state.sk&&state.sk[id]>0&&Array.isArray(row)&&row[2]===generic});return state.eq&&state.eq.weapon&&hasMastery?generic:fac.wcode;}
