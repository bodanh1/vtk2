"use strict";
const EQUIPMENT_REQ_STATS={strength_v:'str',dexterity_v:'dex',vitality_v:'vit',energy_v:'eng'};
// KItemList::EnoughAttrib uses current attributes, including worn equipment.
// Read only these four stats; never recurse into calc() or count a bag item's bonuses.
function equipmentIdentityOk(it){
 if(!it||!sexOk(it))return false;
 if(S.chal==='white'&&((it.r||0)>=2||it.set||it.vio))return false;
 for(const [id,v]of it.req||[]){
  if(id===36&&S.lvl<v)return false;
  if(id===37&&v>=0&&FAC[S.fac]&&heroSeries()!==v)return false;
  if(id===39&&v>=0&&FAC[S.fac]&&FAC[S.fac].id!==v)return false;
 }
 return true;
}
function equipmentRequirementAttrs(eq=S.eq){
 const start=heroStart(),out={};for(const key of Object.values(EQUIPMENT_REQ_STATS))out[key]=start[key]+(S.attr[key]||0);
 const add=(name,value)=>{const key=EQUIPMENT_REQ_STATS[name];if(key)out[key]+=value;};
 for(const it of Object.values(eq||{})){
  if(!equipmentIdentityOk(it))continue;
  const mult=enhMul(it);for(const [id,min,max]of it.base||[])add(attrName(id),(min+max)/2*mult);
  const on=magOn(it.mag,hiddenActive(it,eq));(it.mag||[]).forEach((m,i)=>{if(on[i])add(canonAttr(attrName(m.a)),m.p[0]===-1?0:m.p[0]||0);});
  if(it.set)for(const m of (it.ext||[]).slice(0,goldEnhance(it,eq)))add(canonAttr(attrName(m.a)),m.p[0]===-1?0:m.p[0]||0);
 }
 return out;
}
