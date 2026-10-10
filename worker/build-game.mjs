// Đóng gói mã game (script cổ điển chạy trên trình duyệt) thành một module ES cho Worker,
// để máy chủ tính chỉ số và kiểm định nhân vật bằng đúng code của game thay vì viết lại.
// Chạy tự động trước mỗi lần `wrangler dev/deploy` (build.command trong wrangler.jsonc).
// Kết quả: worker/gen/game.js (không commit).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "worker/gen/game.js");

// Đúng thứ tự trong index.html. Chỉ những file calc() và kiểm định cần.
const FILES = [
  "js/game-clock.js", "data.js", "world.js", "js/ge_patch.js", "js/core.js", "js/modes.js", "js/mount-skill-data.js", "js/mount-rules.js", "js/stats.js", "js/loot.js",
  "js/sets.js", "js/combat.js", "js/save.js", "js/rewards.js", "js/depth.js", "rdata.js", "ref.js", "js/mask-data.js", "js/gear_policy.js", "js/recipes.js", "js/builds.js", "js/ui.js", "js/shop.js", "js/forge.js", "js/auto.js", "js/activities.js", "js/modes_play.js", "js/horse-shop-data.js", "js/siege.js", "js/jianghu-expansion.js",
];
// File chỉ chứa một object dữ liệu lớn: nhúng dạng chuỗi JSON (JSON.parse nhanh hơn literal JS).
const DATA = { "data.js": "JX", "world.js": "JW", "ref.js":"REF", "js/mask-data.js":"JMASK" };

// Những gì module trả về cho máy chủ.
const EXPORTS = [
  "calc", "newSave", "makeItem", "modeItemOk", "itemPower", "baseRow", "lineScale", "reqOk", "isMode",
  "expNeed", "xpSlow", "J", "FAC", "SK", "MAX_LEVEL", "PTS_PER_LEVEL", "SKILL_PTS_PER_LEVEL", "ENH_MAX",
  "LV_MS", "ACH", "LOGIN30", "MODES", "makeSetItem", "dexSet", "setTemplateValues", "DEAD_AFFIX", "INV_MAX",
];

function dataFile(file, key) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(src, ctx, { filename: file });
let obj = ctx.window[key];
  if(key==='REF')obj=Object.fromEntries(['v','refIdByName','setTemplateIds','setLegacyIds','setLegacyNameIds','itemPairById','shardNeeds','shardNames','shardLegacyIds'].map(k=>[k,obj[k]]));
  // JSON chỉ giữ nguyên dữ liệu nếu không có undefined, NaN/Infinity, hàm hay kiểu lạ.
  const check = (v, at) => {
    const t = typeof v;
    if (v === null || t === "string" || t === "boolean") return;
    if (t === "number") { if (!Number.isFinite(v)) throw new Error(`${file}: ${at} = ${v} không chuyển được sang JSON`); return }
    if (t !== "object") throw new Error(`${file}: ${at} có kiểu ${t}`);
    for (const k of Object.keys(v)) check(v[k], at + "." + k);
  };
  check(obj, key);
  const json = JSON.stringify(obj);
  return `window.${key}=JSON.parse(${JSON.stringify(json)});\n`;
}

let body = "";
for (const f of FILES) {
  body += `// ---- ${f}\n`;
  let source=fs.readFileSync(path.join(ROOT,f),'utf8');
  if(f==='js/jianghu-expansion.js')source=source.split('const jhOldSVStart=')[0];
  if(f==='js/loot.js')source=source.replace('items=df.items.filter(x=>x[0]===0&&x[1]<=9);const n=', 'items=null;const n=').replace('for(let i=0;i<cnt;i++){const x=wpick(items,','if(!cnt)return out;const candidates=df.items.filter(x=>x[0]===0&&x[1]<=9);for(let i=0;i<cnt;i++){const x=wpick(candidates,');
  if(f==='js/core.js')source=source.replace('(d=new Date)=>','(d=new Date(gameNow()+25200000))=>');
  if(f==='js/activities.js')source=source.replace('new Date(clockNow())','new Date(clockNow()+25200000)');
  if(f==='js/rewards.js')source=source.replace('new Date(gameNow())','new Date(gameNow()+25200000)').replace('new Date(gameNow());','new Date(gameNow()+25200000);').replace('new Date(gameNow())).getMonth()','new Date(gameNow()+25200000)).getMonth()').replace('setTimeout(()=>grant({xpp:.2,xpb:60},"Xong nhiệm vụ ngày"),0)','grant({xpp:.2,xpb:60},"Xong nhiệm vụ ngày")').replace('const y=new Date;','const y=new Date(gameNow());').replace('(new Date).getMonth()','(new Date(gameNow())).getMonth()');
  body += DATA[f] ? dataFile(f, DATA[f]) : source + "\n";
}

const out = `// TỰ SINH bởi worker/build-game.mjs — không sửa tay.
const window = globalThis;
const noop = () => {};
const stubEl = new Proxy(function () {}, { get: (t, k) => (k === "style" ? {} : k === "classList" ? { add: noop, remove: noop, toggle: noop, contains: () => false } : stubEl), apply: () => stubEl, set: () => true });
for (const [k, v] of Object.entries({
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  document: new Proxy({}, { get: () => () => stubEl }),
  Image: function () {},
  matchMedia: () => ({ matches: false, addEventListener: noop }),
})) if (!(k in globalThis)) globalThis[k] = v;
export const GAME = (function () {
const SV={on:false};
const setTimeout=fn=>{fn();return 0},clearTimeout=()=>{};
${body}
${fs.readFileSync(path.join(ROOT,"worker/economy-engine.js"),"utf8")}
return {
  setS(v) { S = v },
  getS() { return S },
  R, economyEngine,
  ${EXPORTS.join(",\n  ")}
};
})();
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`game bundle: ${OUT} (${(out.length / 1048576).toFixed(2)} MB)`);
