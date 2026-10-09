"use strict";
/* Persistent item grants are authorized and written by the server. */
window.JXADMINBUSY=false;
(function(){
  const A={group:'gear',page:0,rows:[],selected:null,generation:0,requestId:null},$=id=>document.getElementById(id);
  const allowed=()=>typeof CLOUD!=='undefined'&&CLOUD.user?.isAdmin===true;
  function close(){if(window.JXADMINBUSY)return;const panel=$('accountAdminPanel');if(panel)panel.hidden=true;$('app').inert=!!CLOUD.detachedBundle||!$('cloudPanel').classList.contains('hidden');}
  window.accountAdminRefresh=function(){
    let button=$('jxAccountAdmin');if(!allowed()){if(button)button.remove();if($('accountAdminPanel')&&!window.JXADMINBUSY)close();return;}
    if(!button){button=document.createElement('button');button.id='jxAccountAdmin';button.className='rnd';button.type='button';button.title='Admin · danh mục vật phẩm';button.setAttribute('aria-label','Menu Admin');button.innerHTML='<i aria-hidden="true">A</i><span class="sk">Admin</span>';$('jxRanking').after(button);button.onclick=open;}
    button.hidden=$('jxActs').classList.contains('actionsCollapsed');
  };
  function error(e){const box=$('accountAdminError');if(box)box.textContent=e.message;if(['cloud_login','device_changed','save_conflict'].includes(e.code))cloudFail(e);window.accountAdminRefresh();}
  async function load(){
    const generation=++A.generation,params=new URLSearchParams({group:A.group,mode:modeId(),page:A.page,q:$('adminSearch').value,d:$('adminSlot').value,fac:$('adminFaction').value});$('adminRows').textContent='Đang tải danh mục…';
    try{const result=await cloudApi('admin/catalogue?'+params);if(generation!==A.generation||$('accountAdminPanel').hidden)return;A.rows=result.rows;$('adminCount').textContent=`${result.total} món · Trang ${result.pages?result.page+1:0}/${result.pages}`;
      $('adminRows').innerHTML=result.rows.length?result.rows.map((r,i)=>`<button type="button" class="adminCatalogueItem" data-entry="${i}" ${r.available?'':'disabled'}>${r.ic?`<img loading="lazy" src="${esc(r.ic)}" alt="">`:'<i>◇</i>'}<span><b>${esc(r.n)}</b><small>${r.tier?'Cấp đồ '+r.tier+' · ':''}${r.level?'Yêu cầu cấp '+r.level:'Không yêu cầu cấp'}${r.available?'':' · Không dùng ở chế độ này'}</small></span></button>`).join(''):'Không có vật phẩm khớp tìm kiếm.';
      $('adminPrev').disabled=A.page===0;$('adminNext').disabled=A.page+1>=result.pages;$('adminRows').querySelectorAll('[data-entry]').forEach(b=>b.onclick=()=>select(A.rows[+b.dataset.entry]));
    }catch(e){if(generation===A.generation){$('adminRows').textContent='Không tải được danh mục.';error(e);}}
  }
  function select(row){A.selected=row;A.requestId=null;const gear=['gear','mount','gold','platina'].includes(row.group),plain=row.group==='gear',max=gear?Math.max(0,INV_MAX-S.inv.length):row.group==='other'&&row.id!=='tienThao'?1000000000:999;
    $('adminSelection').innerHTML=`<h4>${esc(row.n)}</h4><p>${esc(row.note||'Nhận vào hành trang, khóa bảo vệ; không tự mặc.')}</p><div class="adminGrantOptions"><label>Số lượng<input id="adminQuantity" type="number" min="1" max="${max}" step="1" value="1"></label>${plain?`<label>Phẩm chất<select id="adminQuality">${[0,1,2,3].map(r=>`<option value="${r}" ${r>MC().rarMax?'disabled':''}>${esc(RAR_VI[r])}</option>`).join('')}</select></label>`:''}${gear?'<label>Cường hóa<select id="adminEnhance">'+Array.from({length:ENH_MAX+1},(_,i)=>`<option value="${i}">+${i}</option>`).join('')+'</select></label>':''}</div>${gear?`<small>Túi còn ${max} ô. Yêu cầu mặc đồ và giới hạn chế độ vẫn áp dụng.</small>`:''}<button class="btn" id="adminGrant" type="button" ${max?'':'disabled'}>Nhận vật phẩm</button>`;
    $('adminGrant').onclick=grant;for(const id of ['adminQuantity','adminQuality','adminEnhance'])if($(id))$(id).onchange=()=>A.requestId=null;
  }
  async function grant(){
    if(!allowed()||!A.selected)return;if(!CLOUD.ready||CLOUD.paused||SAVE_LOCK){toast('Mở Tài khoản và chọn tiến trình để đồng bộ trước');return;}if(CLOUD.busy||window.JXADMINBUSY){toast('Đang đồng bộ, hãy thử lại sau');return;}if(ADMV.sandbox){toast('Thoát chế độ thử nghiệm trước khi lấy vật phẩm');return;}
    const row=A.selected,quantity=Number($('adminQuantity').value),quality=Number($('adminQuality')?.value||0),enhance=Number($('adminEnhance')?.value||0);if(!Number.isSafeInteger(quantity)||quantity<1){toast('Nhập số lượng nguyên từ 1 trở lên');return;}
    const identity={user:CLOUD.user.id,slot:SLOT,cid:S.cid};window.JXADMINBUSY=true;$('accountAdminError').textContent='';$('adminGrant').disabled=true;$('adminGrant').textContent='Đang lưu và nhận…';A.requestId=A.requestId||crypto.randomUUID();const requestId=A.requestId;let grantSent=false;$('accountAdminPanel').inert=true;
    try{
      if(!await cloudSync(true))throw new Error(CLOUD.status);CLOUD.busy=true;
      grantSent=true;const result=await cloudApi('admin/grant',{clientId:cloudClientId,revision:CLOUD.revision,requestId,slot:SLOT,id:row.id,quantity,quality,enhance});
      if(CLOUD.user?.id!==identity.user||SLOT!==identity.slot||S.cid!==identity.cid||result.cid!==S.cid||SAVE_LOCK)throw new Error('Vật phẩm đã lưu trên tài khoản; tải lại đúng nhân vật để nhận');
      const d=result.changes;if(d.items){const existing=new Set(S.inv.map(it=>it.uid));for(const it of d.items)if(!existing.has(it.uid)){S.inv.push(it);existing.add(it.uid);}S.uid=Math.max(S.uid,d.uid);if(d.ml)S.ml=d.ml;if(d.setSeen)S.setSeen=d.setSeen;}
      if(d.material){const{group,key,count}=d.material;S.mats=S.mats||{};S.mats[group]=S.mats[group]||{};S.mats[group][key]=count;}
      if(d.potion){const{kind,tier,count}=d.potion;S.potStock=S.potStock||{};S.potStock[kind]=S.potStock[kind]||{};S.potStock[kind][tier]=count;}
      for(const key of ['gold','knb','tienThaoUntil'])if(d[key]!==undefined)S[key]=d[key];
      CLOUD.revision=result.revision;CLOUD.lastSaved=result.updatedAt;CLOUD.lastLeaseAt=Date.now();save();cloudSaveBinding(cloudFingerprint(cloudCapture(false)));cloudStatus('Đã lưu vật phẩm Admin');invDirty=true;R.dirty=true;recalc();updateTop();A.requestId=null;select(row);toast(`Đã nhận ${result.quantity} × ${result.name}`);
    }catch(e){if(grantSent&&!['bad_grant','inventory_full','mode_item','bad_item','no_character','no_purple','cloud_rate','cloud_login','device_changed','save_conflict'].includes(e.code)){e.code='save_conflict';e.message+=' · Mở Tài khoản và tải bản trên máy chủ trước khi nhận tiếp';}error(e);}finally{$('accountAdminPanel').inert=false;CLOUD.busy=false;window.JXADMINBUSY=false;lastT=performance.now();if($('adminGrant')){$('adminGrant').disabled=['gear','mount','gold','platina'].includes(row.group)&&S.inv.length>=INV_MAX;$('adminGrant').textContent='Nhận vật phẩm';}}
  }
  function open(){
    if(!allowed())return;if(!S?.fac){toast('Tạo hoặc chọn nhân vật trước khi mở Admin');return;}
    let panel=$('accountAdminPanel');if(!panel){panel=document.createElement('section');panel.id='accountAdminPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Kho vật phẩm Admin');document.body.append(panel);panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();});}
    panel.innerHTML=`<div class="accountAdminWindow"><header><h3>Admin · Kho vật phẩm</h3><button type="button" id="adminClose" aria-label="Đóng Admin">×</button></header><p class="desc">Tài khoản danh · ${esc(MODES[modeId()].n)} · ${esc(S.name)} · nhận và lưu trên tài khoản.</p><div class="adminCategories">${Object.entries({gear:'Trang bị',mount:'Thú cưỡi',gold:'Hoàng Kim',platina:'Bạch Kim',material:'Nguyên liệu',potion:'Thuốc',other:'Tiền / Bảo vật'}).map(([k,n])=>`<button type="button" class="btn sm ${A.group===k?'on':''}" data-category="${k}">${n}</button>`).join('')}</div><div class="adminCatalogueFilters"><input id="adminSearch" type="search" placeholder="Tìm tên vật phẩm, không cần dấu…"><select id="adminSlot" aria-label="Loại trang bị"><option value="">Mọi loại</option>${['Vũ khí','Ám khí','Áo giáp','Nhẫn','Dây chuyền','Giày','Đai lưng','Mũ','Hộ uyển','Ngọc bội','Thú cưỡi'].map((n,i)=>`<option value="${i}">${n}</option>`).join('')}</select><select id="adminFaction" aria-label="Phái"><option value="">Mọi phái</option>${Object.values(FAC).map(f=>`<option value="${f.id}">${esc(f.n)}</option>`).join('')}</select></div><p id="accountAdminError" role="alert"></p><div class="adminCatalogueBody"><div><div id="adminRows"></div><div class="adminPagination"><button class="btn sm" id="adminPrev">‹ Trước</button><span id="adminCount"></span><button class="btn sm" id="adminNext">Sau ›</button></div></div><aside id="adminSelection"><p>Chọn một vật phẩm để xem cách nhận.</p></aside></div></div>`;
    panel.hidden=false;$('app').inert=true;$('adminClose').onclick=close;A.page=0;A.selected=null;
    panel.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{if(window.JXADMINBUSY)return;A.group=b.dataset.category;A.page=0;A.selected=null;$('adminSelection').innerHTML='<p>Chọn một vật phẩm.</p>';$('adminSlot').value='';panel.querySelectorAll('[data-category]').forEach(t=>t.classList.toggle('on',t===b));load();});
    let timer;$('adminSearch').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>{A.page=0;load();},250);};for(const id of ['adminSlot','adminFaction'])$(id).onchange=()=>{A.page=0;load();};$('adminPrev').onclick=()=>{if(A.page>0){A.page--;load();}};$('adminNext').onclick=()=>{A.page++;load();};load();
  }
  window.accountAdminRefresh();
})();
