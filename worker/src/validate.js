// Kiểm định nhân vật theo từng chế độ bằng chính code của game (worker/gen/game.js).
// Máy chủ không tin chỉ số do client gửi: tự tính lại bằng calc() và soi từng món trang bị.
import { GAME as G } from "../gen/game.js";
import {ADMIN_REFERENCE} from "./admin-reference-data.js";

export const BRACKETS = [
  { k: "so", n: "Sơ cấp", lo: 40, hi: 79 },
  { k: "trung", n: "Trung cấp", lo: 80, hi: 99 },
  { k: "cao", n: "Cao cấp", lo: 100, hi: 119 },
  { k: "thuong", n: "Thượng thừa", lo: 120, hi: Infinity },
];
export const bracketOf = (lvl) => BRACKETS.find((b) => lvl >= b.lo && lvl <= b.hi) || null;

/* ---- Ngưỡng cấp theo giờ chơi ----
   Mỗi cấp L cần (10 + 1.4L) × xpSlow(L) lần hạ quái cùng cấp (xem expFor/gainXp trong combat.js).
   Ước lượng cố ý rộng tay: tối đa 2 quái/giây và hệ số EXP ×8 (×4 từ tinh anh, boss, quái cao cấp hơn, đồ cộng EXP; ×2 Tiên Thảo Lộ),
   nhân tốc độ mô phỏng tối đa của chế độ, cộng thêm 25% và 1 giờ dự phòng. Chỉ nhân vật vượt xa mức này mới bị gắn cờ. */
// Giữ ngưỡng x2.5 lịch sử để không gắn cờ người chơi hợp lệ trước khi đổi tốc độ.
export const LV_TIME = { kps: 2, xpMul: 8, slack: 1.25, graceSec: 3600, speedMax: Math.max(2.5, ...G.MODES.ctc.speeds) };
const LV_SEC = [0, 0];
for (let L = 1; L <= G.MAX_LEVEL; L++)
  LV_SEC[L + 1] = LV_SEC[L] + ((10 + 1.4 * L) * G.xpSlow(L)) / (LV_TIME.kps * LV_TIME.xpMul * LV_TIME.speedMax);

// Số giây chơi tối thiểu (đã cộng dự phòng) để đạt cấp lvl.
export const minSecForLevel = (lvl) => Math.max(0, LV_SEC[Math.min(lvl, G.MAX_LEVEL)] * LV_TIME.slack - LV_TIME.graceSec);

export function levelCapForTime(sec) {
  let L = 1;
  while (L < G.MAX_LEVEL && minSecForLevel(L + 1) <= sec) L++;
  return L;
}

/* ---- Trang bị ---- */
// Giá trị tuyệt đối lớn nhất mỗi thuộc tính phụ có thể roll ra (dòng đầu p[0]).
const AFFIX_MAX = new Map();
for (const a of G.J.affix) {
  const [mn, mx] = a.p[0] || [0, 0];
  const v = Math.max(Math.abs(mn), Math.abs(mx));
  AFFIX_MAX.set(a.a, Math.max(AFFIX_MAX.get(a.a) || 0, v));
}
const LINE_SCALE_MAX = 1.18; // lineScale() trong loot.js tối đa 1 + 0.18
const MAG_MAX = 6;

const SET_BY_ID=new Map();for(const kind of ['gold','platina'])G.J.sets[kind].forEach((row,i)=>{const id=ADMIN_REFERENCE.setIds[kind][i];if(id)SET_BY_ID.set(id,{kind,row});});
const NORMAL_MAX=new Map();for(const row of G.J.affix)for(let i=0;i<row.p.length;i++)NORMAL_MAX.set(row.a+':'+i,Math.max(NORMAL_MAX.get(row.a+':'+i)||0,...row.p[i].map(Math.abs)));
const PURPLE_MAX=new Map();for(const row of G.J.affixLevel)for(let i=0;i<row.p.length;i++){const [lo,hi]=row.p[i];PURPLE_MAX.set(row.a+':'+i,Math.max(PURPLE_MAX.get(row.a+':'+i)||0,Math.abs(lo),Math.abs(hi)));}
function baseFits(it,row){const seen=new Set();return Array.isArray(it.base)&&it.base.every(line=>{if(!Array.isArray(line)||seen.has(line[0]))return false;seen.add(line[0]);const rb=row.base.find(b=>b[0]===line[0]);return rb&&line.slice(1).every(v=>Number.isFinite(v)&&Math.abs(v)<=Math.max(Math.abs(rb[1]),Math.abs(rb[2]))+.5);});}
function setLinesFit(lines,indices){if(!Array.isArray(lines)||lines.length>indices.length)return false;const allowed=indices.map(i=>G.J.ge[i]).filter(Boolean),used=new Set();return lines.every(m=>{const i=allowed.findIndex((r,n)=>!used.has(n)&&r.a===m.a&&Array.isArray(m.p)&&m.p.every((v,j)=>Number.isFinite(v)&&r.p[j]&&Math.abs(v)<=Math.max(...r.p[j].map(Math.abs))+.5));if(i<0)return false;used.add(i);return true;});}
function checkItem(it,slot,flags,mode){
 const where=slot+': '+String(it?.n||'?').slice(0,40);
 if(!it||typeof it!=='object')return flags.push(['item_bad',where]);
 if(!G.modeItemOk(it,mode))flags.push(['item_mode',where+' vượt trần đồ '+G.MODES[mode].n]);
 if(!Number.isInteger(it.enh||0)||(it.enh||0)<0||(it.enh||0)>G.ENH_MAX||!Number.isInteger(it.plv||0)||(it.plv||0)<0||(it.plv||0)>10||it.plv&&it.set?.kind!=='platina')flags.push(['item_enh',where+' vượt giới hạn cường hóa']);
 if(it.set){
  const kind=it.set.kind,found=it.refId?SET_BY_ID.get(it.refId):null;
  const rows=found?(found.kind===kind?[found.row]:[]):(G.J.sets[kind]||[]);
  const matches=rows.filter(r=>r.d===it.d&&r.k===it.k&&r.lvl===it.lvl&&r.s===it.s&&r.grp===it.set.grp&&r.sid===it.set.sid);
  if(!matches.length||!matches.some(r=>baseFits(it,r)&&(r.n1||99)===it.set.n1&&(r.n2||99)===it.set.n2))flags.push(['item_base',where+' không khớp mẫu đồ bộ']);
  if(!matches.some(r=>setLinesFit(it.mag||[],r.mag)&&setLinesFit(it.ext||[],r.ext)))flags.push(['item_affix',where+' thuộc tính không khớp đồ bộ']);
  return;
 }
 const rows=(G.J.items[it.d]?.list||[]).filter(r=>r.k===it.k&&r.lvl===it.lvl&&(!Number.isInteger(it.p)||r.p===it.p));
 if(!rows.length||!rows.some(r=>baseFits(it,r)))flags.push(['item_base',where+' không khớp chỉ số gốc']);
 const mag=Array.isArray(it.mag)?it.mag:[];if(mag.length>MAG_MAX)flags.push(['item_affix',where+' quá 6 dòng']);
 for(const m of mag){if(!m||!Array.isArray(m.p)||m.p.some((v,i)=>{const cap=it.vio?PURPLE_MAX.get(m.a+':'+i):i===0?AFFIX_MAX.get(m.a):NORMAL_MAX.get(m.a+':'+i);return !Number.isFinite(v)||cap===undefined||Math.abs(v)>cap*(i===0&&!it.vio?LINE_SCALE_MAX:1)+1;}))flags.push(['item_affix',where+' thuộc tính ngoài giới hạn']);}
}

/* ---- Toàn bộ nhân vật ---- */
const ATTR_SLACK = 120, SKILL_SLACK = 25;
// Điểm tiềm năng thưởng ngoài lên cấp: mốc cấp (theo cấp đã đạt), thành tựu, điểm danh 30 ngày (một lần),
// cộng nguồn lặp lại theo thời gian chơi (điểm danh 7 ngày, cửa hàng công thành/Tống Kim, rương Phúc Duyên…).
const ptsOf = (g) => (g && +g.pts) || 0;
const ATTR_ONCE = G.ACH.reduce((s, a) => s + ptsOf(a[3]), 0) + Object.values(G.LOGIN30).reduce((s, g) => s + ptsOf(g), 0);
const attrMilestones = (lvl) => G.LV_MS.reduce((s, [lv, g]) => s + (lvl >= lv ? ptsOf(g) : 0), 0);
export const ATTR_PER_HOUR = 20, ATTR_GUEST_TIME = 400, REBORN_PTS = 50;
export function attrBudget(state, playSec) {
  const lvl = Math.floor(state.lvl), reborn = Math.max(0, +(state.rw && state.rw.stat && state.rw.stat.reborn) || 0);
  // Nguồn lặp lại tính theo giờ chơi nhưng có trần theo cấp, để chơi rất lâu cũng không mở toang giới hạn.
  const timed = Math.min(playSec != null ? Math.ceil((playSec / 3600) * ATTR_PER_HOUR) : ATTR_GUEST_TIME, 40 + lvl * 4);
  return (lvl - 1) * G.PTS_PER_LEVEL + ATTR_SLACK + attrMilestones(lvl) + ATTR_ONCE + reborn * REBORN_PTS + timed;
}

// Trả về { flags: [[code, detail]], power, bracket, P } . playSec: giờ chơi máy chủ đã đo (null với khách).
export function validateChar(state, playSec, mode="ctc") {
  const flags = [];
  mode=G.isMode(mode)?mode:'ctc';
  const lvl = Math.floor(state.lvl),reborn=Math.max(0,Math.min(10,Math.floor(state.rw?.stat?.reborn||0)));
  for (const [slot, it] of Object.entries(state.eq || {})) if (it) checkItem(it, slot, flags,mode);

  const attr = state.attr || {};
  const attrUsed = ["str", "dex", "vit", "eng"].reduce((s, k) => s + Math.max(0, +attr[k] || 0), 0) + Math.max(0, +state.attrPts || 0);
  const attrMax = attrBudget(state, playSec);
  if (attrUsed > attrMax) flags.push(["attr_points", `Điểm tiềm năng ${attrUsed} > ${attrMax}`]);

  let skUsed = Math.max(0, +state.skPts || 0);
  for (const [id, v] of Object.entries(state.sk || {})) {
    const lv = Math.max(0, +v || 0), sk = G.SK[id];
    skUsed += lv;
    if (!sk) flags.push(["skill", `Kỹ năng lạ (${id})`]);
    else if (lv > (sk.max || 20) + 5) flags.push(["skill", `${sk.n} cấp ${lv} > ${sk.max}`]);
  }
  const skMax = ((lvl - 1)+reborn*(G.MAX_LEVEL-1)) * G.SKILL_PTS_PER_LEVEL + 1 + SKILL_SLACK;
  if (skUsed > skMax) flags.push(["skill_points", `Điểm kỹ năng ${skUsed} > ${skMax}`]);

  const timeMultiplier=Math.max(1,G.MODES[mode].expMul)*(1+.2*reborn)*(mode==='g2'?2:1);
  if (playSec != null && !G.MODES[mode].admin && lvl > levelCapForTime(playSec*timeMultiplier))
    flags.push(["level_time", `Cấp ${lvl} sau ${(playSec / 3600).toFixed(1)} giờ chơi (tối đa ${levelCapForTime(playSec*timeMultiplier)})`]);

  // Chỉ số do máy chủ tự tính.
  let P = null, power = 0;const previous=G.getS();
  try {
    // Bổ sung trường thiếu bằng giá trị mặc định (migrate() của game cần cả code giao diện).
    const s = Object.assign(G.newSave(), JSON.parse(JSON.stringify(state)));
    s.mode = G.isMode(mode)?mode:"ctc";
    G.setS(s);
    P = G.calc();
    const dps = (P.main && P.main.dps) || 0;
    power = Math.round(Math.sqrt(Math.max(1, P.life) * Math.max(1, dps)) * 10);
    if(!Number.isFinite(power))throw new Error("Invalid power");
  } catch (e) {
    flags.push(["calc", "Không tính được chỉ số nhân vật"]);power=0;
  }finally{G.setS(previous);}
  return { flags, power, bracket: bracketOf(lvl), P };
}

export const FLAG_TEXT = {
  item_bad: "Trang bị hỏng",
  item_mode: "Trang bị vượt giới hạn chế độ",
  item_base: "Trang bị vượt giới hạn",
  item_affix: "Thuộc tính trang bị vượt giới hạn",
  item_enh: "Cường hóa vượt giới hạn",
  attr_points: "Điểm tiềm năng vượt giới hạn",
  skill: "Kỹ năng vượt giới hạn",
  skill_points: "Điểm kỹ năng vượt giới hạn",
  level_time: "Cấp vượt ngưỡng giờ chơi",
  calc: "Dữ liệu nhân vật bất thường",
};
