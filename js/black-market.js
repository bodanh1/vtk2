"use strict";
(function(){
 const M={page:0,mine:false,rows:[],generation:0,busy:false},$=id=>document.getElementById(id);
 function close(){if(M.busy)return;$('blackMarketPanel').hidden=true;$('app').inert=false;}
 const price=r=>r.price.toLocaleString('vi-VN')+(r.currency==='knb'?' KNB':' vạn');
 const error=e=>{if(['save_conflict','device_changed','cloud_login','market_restore'].includes(e.code))cloudFail(e);if($('marketError'))$('marketError').textContent=e.message;};
 async function transaction(action,extra={},automatic=false){
  if(!CLOUD.user||!CLOUD.ready||CLOUD.paused||SAVE_LOCK||ADMV.sandbox){if(!automatic)toast('Đăng nhập và chọn tiến trình tài khoản trước khi giao dịch');return false;}
  if(CLOUD.busy||M.busy||window.JXADMINBUSY)return false;
  M.busy=true;window.JXADMINBUSY=true;let sent=false;
  const identity={user:CLOUD.user.id,slot:SLOT,cid:S.cid},panel=$('blackMarketPanel');if(panel)panel.inert=true;
  try{
   if(!automatic&&!await originalSync(true))throw new Error(CLOUD.status);
   CLOUD.busy=true;sent=true;
   const r=await cloudApi('market/'+action,{...extra,clientId:cloudClientId,revision:CLOUD.revision,requestId:crypto.randomUUID(),slot:SLOT,bundle:cloudCapture()});
   if(r.unchanged){CLOUD.marketPending=false;if(!automatic&&r.message)toast(r.message);return true;}
   if(CLOUD.user?.id!==identity.user||SLOT!==identity.slot||S.cid!==identity.cid||r.cid!==S.cid||SAVE_LOCK)throw new Error('Giao dịch đã lưu; tải bản tài khoản của đúng nhân vật');
   Object.assign(S,r.changes);if(r.patch&&typeof economyApply==='function')economyApply(r);CLOUD.revision=r.revision;CLOUD.lastSaved=r.updatedAt;CLOUD.lastLeaseAt=Date.now();save();cloudSaveBinding(cloudFingerprint(cloudCapture(false)));invDirty=true;R.dirty=true;recalc();updateTop();CLOUD.marketPending=false;cloudStatus('Đã lưu giao dịch Chợ đen');if(!automatic||r.message)toast(r.message);if(automatic&&panel&&!panel.hidden){inventory();load();}return true;
  }catch(e){if(sent&&(!e.code||e.code==='offline')){e.code='save_conflict';e.message+=' · Tải bản trên tài khoản để kiểm tra kết quả trước khi giao dịch tiếp';}error(e);return false;}
  finally{if(panel)panel.inert=false;CLOUD.busy=false;M.busy=false;window.JXADMINBUSY=false;lastT=performance.now();}
 }
 const originalSync=cloudSync;
 cloudSync=async function(force=false){const ok=await originalSync(force);if(ok&&CLOUD.marketPending&&S?.fac&&!M.busy&&!window.JXADMINBUSY&&!document.hidden)await transaction('collect',{},true);return ok;};
 async function load(){
  const generation=++M.generation,q=$('marketSearch').value,params=new URLSearchParams({mode:modeId(),mine:M.mine?'1':'0',page:M.page,q});$('marketRows').textContent='Đang tải…';
  try{const r=await cloudApi('market/list?'+params);if(generation!==M.generation||$('blackMarketPanel').hidden)return;M.rows=r.rows;
   $('marketRows').innerHTML=r.rows.length?r.rows.map((row,i)=>`<article class="marketRow"><button class="marketItem" data-info="${i}">${row.item.ic?`<img src="${esc(row.item.ic)}" loading="lazy" alt="">`:''}<span><b>${esc(row.name)}</b><small>Cấp ${row.item.lvl||1} · +${row.item.enh||0} · ${esc(row.seller_name)}</small></span></button><div><b>${price(row)}</b><small>${row.status==='sold'?'Đã bán · tiền chờ nhận':row.expires_at<=r.now?'Hết hạn · đồ chờ nhận':Math.ceil((row.expires_at-r.now)/3600000)+' giờ còn lại'}</small><button class="btn sm" data-trade="${i}" ${row.status==='sold'?'disabled':''}>${row.mine?'Nhận lại':'Mua'}</button></div></article>`).join(''):'Chưa có món đồ phù hợp.';
   $('marketPage').textContent=`${r.total} món · ${r.pages?M.page+1:0}/${r.pages}`;$('marketPrev').disabled=M.page===0;$('marketNext').disabled=M.page+1>=r.pages;
   $('marketRows').querySelectorAll('[data-info]').forEach(b=>b.onclick=()=>{const row=M.rows[+b.dataset.info];$('marketDetails').innerHTML=`<h4>${esc(row.name)}</h4>${itemHTML(row.item)}<p>Giá: ${price(row)}</p>`;});
   $('marketRows').querySelectorAll('[data-trade]').forEach(b=>b.onclick=async()=>{const row=M.rows[+b.dataset.trade];if(!confirm(row.mine?'Nhận lại '+row.name+'?':'Mua '+row.name+' với giá '+price(row)+'?'))return;if(await transaction(row.mine?'cancel':'buy',{id:row.id}))load();});
  }catch(e){if(generation===M.generation){$('marketRows').textContent='Không tải được chợ.';error(e);}}
 }
 function inventory(){
  const rows=S.inv.filter(it=>!it.locked);$('marketPost').innerHTML=`<h4>Đăng đồ · thời hạn 3 ngày</h4><small>Đồ được giữ trên chợ ngay khi đăng. Bỏ khóa bảo vệ trong hành trang để chọn đồ.</small><select id="marketItemSelect" aria-label="Đồ đăng bán"><option value="">Chọn vật phẩm trong hành trang</option>${rows.map(it=>`<option value="${it.uid}">${esc(it.n)} · cấp ${it.lvl} · +${it.enh||0}</option>`).join('')}</select><div id="marketPreview"></div><div class="btnrow"><select id="marketCurrency" aria-label="Tiền bán"><option value="knb">Kim Nguyên Bảo</option><option value="gold">Tiền vạn</option></select><input id="marketPrice" type="number" min="1" max="1000000000" step="1" value="5" aria-label="Giá bán"><button class="btn" id="marketPublish">Đăng bán</button></div>`;
  $('marketItemSelect').onchange=()=>{const it=S.inv.find(it=>it.uid===Number($('marketItemSelect').value));$('marketPreview').innerHTML=it?itemHTML(it):'';};
  $('marketPublish').onclick=async()=>{const uid=Number($('marketItemSelect').value),p=Number($('marketPrice').value),currency=$('marketCurrency').value,it=S.inv.find(it=>it.uid===uid);if(!it||!Number.isSafeInteger(p)||p<1||p>1000000000){toast('Chọn đồ và nhập giá nguyên từ 1 đến 1 tỷ');return;}if(!confirm('Đăng '+it.n+' giá '+p.toLocaleString('vi-VN')+(currency==='knb'?' KNB':' vạn')+' trong 3 ngày?'))return;if(await transaction('post',{uid,price:p,currency})){inventory();load();}};
 }
 function open(){
  $('jxOverflow').classList.add('hidden');$('jxMenu').setAttribute('aria-expanded','false');
  if(!CLOUD.user){cloudAccountMenu();return;}if(!S.fac||!CLOUD.ready||CLOUD.paused){toast('Chọn nhân vật và đồng bộ tài khoản trước');return;}
  let panel=$('blackMarketPanel');if(!panel){panel=document.createElement('section');panel.id='blackMarketPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Chợ đen');document.body.append(panel);panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();});}
  panel.innerHTML=`<div class="marketWindow"><header><h3>Chợ đen · ${esc(MODES[modeId()].n)}</h3><button class="btn sm" id="marketClose">Đóng</button></header><p class="desc">Giao dịch giữa tài khoản trong cùng chế độ · tối đa 10 món đang treo. Tiền và đồ hết hạn tự nhận khi đồng bộ; túi đầy thì đồ được giữ chờ nhận.</p><div class="btnrow"><button class="btn sm" id="marketAll">Đang bán</button><button class="btn sm" id="marketMine">Đồ của tôi</button><button class="btn sm" id="marketCollect">Nhận tiền / đồ hết hạn</button><input id="marketSearch" type="search" placeholder="Tìm tên đồ"></div><p id="marketError" class="bad" role="alert"></p><div class="marketBody"><div><div id="marketDetails"></div><div id="marketRows"></div><div class="btnrow"><button class="btn sm" id="marketPrev">‹</button><span id="marketPage"></span><button class="btn sm" id="marketNext">›</button><button class="btn sm" id="marketReload">Tải lại</button></div></div><aside id="marketPost"></aside></div></div>`;
  panel.hidden=false;$('app').inert=true;$('marketClose').onclick=close;M.page=0;M.mine=false;
  $('marketAll').onclick=()=>{M.mine=false;M.page=0;load();};$('marketMine').onclick=()=>{M.mine=true;M.page=0;load();};$('marketCollect').onclick=async()=>{if(await transaction('collect')){inventory();load();}};
  $('marketReload').onclick=load;$('marketPrev').onclick=()=>{M.page--;load();};$('marketNext').onclick=()=>{M.page++;load();};let timer;$('marketSearch').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>{M.page=0;load();},300);};inventory();load();
 }
 $('jxBlackMarket').onclick=open;
})();
