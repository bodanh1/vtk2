import { GAME as G } from '../gen/game.js';
import { HttpError } from './http.js';
import { ADMIN_REFERENCE as REF } from './admin-reference-data.js';

export const isAccountAdmin = account => account?.username === 'danh';
export function requireAccountAdmin(account) { if (!isAccountAdmin(account)) throw new HttpError(403,'admin_only','Chỉ tài khoản admin được dùng chức năng này'); }
const GROUPS={gear:'Trang bị',mount:'Thú cưỡi',gold:'Hoàng Kim',platina:'Bạch Kim',material:'Nguyên liệu',potion:'Thuốc',other:'Tiền / Bảo vật'};
const SLOTS=['Vũ khí','Ám khí','Áo giáp','Nhẫn','Dây chuyền','Giày','Đai lưng','Mũ','Hộ uyển','Ngọc bội','Thú cưỡi'];
const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
let catalogue;
function allEntries(){
  if(catalogue)return catalogue; const rows=[],horses=new Set(REF.horses);
  const add=(id,group,row,extra={})=>rows.push({id,group,n:row.n,ic:row.ic||'',d:row.d??null,tier:row.lvl||0,level:(row.req||[]).find(r=>r[0]===36)?.[1]||0,fac:(row.req||[]).find(r=>r[0]===39)?.[1]??-1,sex:(row.req||[]).find(r=>r[0]===38)?.[1]??-1,...extra});
  for(const[d,g]of Object.entries(G.J.items))g.list.forEach((r,i)=>{if(+d!==10||horses.has(i))add(`e:${d}:${i}`,+d===10?'mount':'gear',{...r,d:+d});});
  for(const kind of ['gold','platina'])G.J.sets[kind].forEach((r,i)=>add(`${kind}:${i}`,kind,r));
  G.J.potions.forEach((p,i)=>add(`p:${i}`,'potion',p,{note:`Hồi ${p.total} ${p.kind==='life'?'sinh lực':'nội lực'}`}));
  for(let l=1;l<=10;l++)add(`m:ht:${l}`,'material',{n:`Huyền Tinh Khoáng Thạch cấp ${l}`,lvl:l});
  for(const[k,n]of Object.entries({thbt:'Tinh Hồng Bảo Thạch',wc:'Thủy Tinh Trắng',mys:'Thần Bí Khoáng Thạch'}))add(`m:misc:${k}`,'material',{n});
  for(const[id,n]of Object.entries(REF.shards))add(`m:shard:${id}`,'material',{n:`Mảnh ${n}`});
  for(let place=0;place<6;place++){const attrs=[...new Set(G.J.affixLevel.filter(r=>r.lvl===1&&r.pre===(place%2===0?1:0)&&!G.DEAD_AFFIX.has(G.J.attr[r.a]?.replace('_yan',''))).map(r=>r.a))];for(const a of attrs)for(let l=1;l<=10;l++)add(`m:ore:${place}:${a}:${l}`,'material',{n:`Khoáng thạch dòng ${place+1} · ${G.J.affixLevel.find(r=>r.a===a)?.n||G.J.attr[a]} · cấp ${l}`,lvl:l});}
  add('gold','other',{n:'Ngân lượng'},{note:'Số lượng tính bằng lượng'});add('knb','other',{n:'Kim Nguyên Bảo'},{note:'Số lượng tính bằng viên'});add('tienThao','other',{n:'Tiên Thảo Lộ',ic:'img/i/tien-thao-lo.png'},{note:'Nhận là dùng: mỗi bình thêm 60 phút EXP ×2'});
  catalogue=rows;return rows;
}
export function adminCatalogue(params){
  const group=params.get('group')||'gear',mode=G.MODES[params.get('mode')]||G.MODES.g2;if(!Object.hasOwn(GROUPS,group))throw new HttpError(400,'bad_group');
  const q=fold((params.get('q')||'').slice(0,80)),d=params.get('d'),fac=params.get('fac');
  const filtered=allEntries().filter(r=>r.group===group&&(!q||fold(r.n).includes(q))&&(d===null||d===''||r.d===+d)&&(fac===null||fac===''||r.fac<0||r.fac===+fac));
  const page=Math.max(0,Math.min(1000,parseInt(params.get('page')||'0',10)||0)),size=40;
  return{groups:GROUPS,slots:SLOTS,total:filtered.length,page,pages:Math.ceil(filtered.length/size),rows:filtered.slice(page*size,(page+1)*size).map(r=>({...r,available:!(r.group==='gold'&&!mode.hk||r.group==='platina'&&!mode.platina)}))};
}
const int=(v,min,max,label)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw new HttpError(400,'bad_grant',label+' không hợp lệ');return v;};
function makePurple(it){
  const melee=['sword','blade','wand','spear','hammer','dualblades'],ranged=['darts','knife','crossbow'],slots={2:'armor',3:'ring',4:'necklace',5:'boot',6:'belt',7:'helm',8:'cuff',9:'pendant'};
  const kind=it.d===0?melee[it.k]:it.d===1?ranged[it.k]:slots[it.d],used=new Set();it.mag=[];
  for(let place=0;place<6;place++){const candidates=G.J.affixLevel.filter(r=>r.pre===(place%2===0?1:0)&&r.lvl<=it.lvl&&(r.s<0||r.s===it.s)&&(r.w||{})[kind]>0&&!used.has(r.a)&&!G.DEAD_AFFIX.has(G.J.attr[r.a]?.replace('_yan',''))).sort((a,b)=>b.lvl-a.lvl);const r=candidates[0];if(!r)break;used.add(r.a);it.mag.push({a:r.a,p:r.p.map(([lo,hi])=>Math.max(lo,hi)),n:r.n,pre:r.pre,vlv:r.lvl});}
  if(!it.mag.length)throw new HttpError(400,'no_purple','Loại trang bị này chưa có dữ liệu khảm Tím');it.vio=1;it.r=3;
}
export function createAdminGrant(bundle,body){
  const slot=int(body.slot,0,2,'Ô nhân vật'),state=bundle.slots[slot];if(!state?.fac)throw new HttpError(400,'no_character','Hãy tạo nhân vật trước');
  const entry=allEntries().find(r=>r.id===body.id);if(!entry)throw new HttpError(400,'bad_item','Vật phẩm không có trong danh mục');
  const qty=int(body.quantity,1,entry.group==='other'&&body.id!=='tienThao'?1000000000:999,'Số lượng'),items=[];
  const mode=G.MODES[state.mode];if(entry.group==='gold'&&!mode.hk||entry.group==='platina'&&!mode.platina)throw new HttpError(400,'mode_item','Chế độ hiện tại không hỗ trợ phẩm chất này');
  const previous=G.getS();G.setS(state);
  try{
    if(['gear','mount','gold','platina'].includes(entry.group)){
      if((state.inv||[]).length+qty>G.INV_MAX)throw new HttpError(400,'inventory_full','Hành trang không đủ chỗ; cất hoặc bán đồ trước');
      const quality=int(body.quality??0,0,3,'Phẩm chất'),enh=int(body.enhance??0,0,G.ENH_MAX,'Cường hóa');
      if(['gear','mount'].includes(entry.group)&&quality>mode.rarMax)throw new HttpError(400,'mode_item','Chế độ hiện tại không hỗ trợ phẩm chất này');
      const uids=[...(state.inv||[]),...Object.values(state.eq||{}),...(state.ground||[]).map(r=>r.it)].filter(Boolean).map(r=>r.uid).filter(Number.isSafeInteger);state.uid=Math.max(Number.isSafeInteger(state.uid)?state.uid:1,...uids.map(n=>n+1));
      for(let n=0;n<qty;n++){let it;
        if(entry.group==='gear'||entry.group==='mount'){const[,d,i]=entry.id.split(':').map((v,k)=>k?Number(v):v),row=G.J.items[d].list[i];it=G.makeItem(d,row.k,row.lvl,[0,2,6,0][quality]);if(quality===3)makePurple(it);}
        else{const[kind,i]=entry.id.split(':');it=G.makeSetItem(kind,G.J.sets[kind][+i],10);if(it&&REF.setIds[kind][+i]){it.refId=REF.setIds[kind][+i];delete it.refPending;G.dexSet(it);}}
        if(!it)throw new HttpError(400,'bad_item','Không thể tạo vật phẩm');it.enh=enh;it.locked=true;items.push(it);
      }
      state.inv=(state.inv||[]).concat(items);
    }else if(entry.group==='potion'){const p=G.J.potions[+entry.id.split(':')[1]];state.potStock=state.potStock||{};const stock=state.potStock[p.kind]||(state.potStock[p.kind]={});stock[p.tier]=(stock[p.tier]||0)+qty;}
    else if(entry.group==='material'){const[,group,...key]=entry.id.split(':');state.mats=state.mats||{};const stock=state.mats[group]||(state.mats[group]={}),k=key.join(':');stock[k]=(stock[k]||0)+qty;}
    else if(entry.id==='tienThao')state.tienThaoUntil=Math.max(Date.now(),state.tienThaoUntil||0)+qty*3600000;
    else state[entry.id==='knb'?'knb':'gold']=(state[entry.id==='knb'?'knb':'gold']||0)+qty;
    return{bundle,state,items,name:entry.n,quantity:qty};
  }finally{G.setS(previous);}
}
