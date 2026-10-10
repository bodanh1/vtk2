"use strict";
(()=>{
  let selected='ctc',busy=false,lastSync=0,generation=0,lastFingerprint='',retryAt=0;
  const ready=()=>typeof S!=='undefined'&&S&&S.fac&&!(typeof ADMV!=='undefined'&&ADMV.sandbox);
  async function request(path,body){if(Date.now()<retryAt)throw Error('Máy chủ đang chờ mở lại hạn mức');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch('/api/player-rankings'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:ctl.signal});const data=await r.json();if(!r.ok){if(data.retryAfter)retryAt=Date.now()+data.retryAfter*1000;throw Error(data.msg||'Chưa kết nối được bảng xếp hạng')}return data;}finally{clearTimeout(timer)}}
  async function sync(){
    if(!ready()||document.hidden||busy||Date.now()<retryAt)return;busy=true;
    try{let guestId=localStorage.getItem('jxidle_presence_guest');if(!guestId){guestId=crypto.randomUUID();localStorage.setItem('jxidle_presence_guest',guestId)}
      const fingerprint=JSON.stringify([S.cid,S.name,S.fac,S.mode,S.lvl,S.xp,S.eq,S.attr,S.sk,S.reborn]);if(fingerprint===lastFingerprint&&Date.now()-lastSync<900000)return;
      if(!S.cid){S.cid=crypto.randomUUID();save()}const state=JSON.parse(JSON.stringify(S));for(const k of ['inv','trainBots','botParty','online','snd','logs'])delete state[k];
      await request('',{guestId,state});lastSync=Date.now();lastFingerprint=fingerprint;
    }catch(e){/* Tiến trình tại máy vẫn tiếp tục khi mất mạng. */}finally{busy=false}
  }
  async function load(){const gen=++generation,body=document.getElementById('rankingRows');if(!body)return;body.textContent='Đang tải…';try{const data=await request('?mode='+selected);if(gen!==generation||!document.getElementById('rankingRows'))return;body.innerHTML=data.rows.length?'<div class="rankingTable"><table><thead><tr><th>Hạng</th><th>Nhân vật</th><th>Phái</th><th>Cấp</th><th>Lực chiến</th></tr></thead><tbody>'+data.rows.map(r=>`<tr><td>${r.rank}</td><td>${esc(r.name)}</td><td>${esc(FAC[r.fac]?.n||r.fac)}</td><td>${r.lvl}</td><td>${fmt(r.power)}</td></tr>`).join('')+'</tbody></table></div>':'Chưa có người chơi đồng bộ ở chế độ này.';}catch(e){if(gen===generation&&document.getElementById('rankingRows'))body.textContent=e.message}}
  async function open(){if(!ready())return;selected=modeId();modal(`<h3>Xếp hạng người chơi</h3><div class="dtabs" id="rankingTabs">${['ctc','phlt','g2'].map(m=>`<button class="${selected===m?'on':''}" data-mode="${m}">${esc(MODES[m].n)}</button>`).join('')}</div><p class="desc">Xếp theo cấp, sau đó lực chiến. Top 100 mỗi chế độ · không tính bot.</p><div id="rankingRows">Đang tải…</div><button class="btn" id="rankingReload">Làm mới</button>`,()=>{document.querySelectorAll('#rankingTabs button').forEach(b=>b.onclick=()=>{selected=b.dataset.mode;document.querySelectorAll('#rankingTabs button').forEach(t=>t.classList.toggle('on',t===b));load()});document.getElementById('rankingReload').onclick=load;});await sync();load()}
  document.getElementById('jxRanking').onclick=open;
  setInterval(()=>{if(Date.now()-lastSync>=300000)sync();if(!document.hidden&&document.getElementById('rankingRows')&&!document.getElementById('modal').classList.contains('hidden'))load()},30000);
  setTimeout(sync,3000);addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
})();
