"use strict";
// Local gameplay, saved with the current character. Reuses the existing UI pulse.
const RPS_HANDS=[['keo','Kéo','✌'],['bua','Búa','✊'],['bao','Bao','✋']],RPS_MINUTE=60000;
const RPS_BEATS={keo:'bao',bua:'keo',bao:'bua'};
let rpsCurrency='gold',rpsAmount='10',rpsHand='keo',rpsPulseState=null,rpsPulseSecond=-1;
function rpsState(){
 if(!S.rps||typeof S.rps!=='object'||Array.isArray(S.rps))S.rps={};
 const s=S.rps;if(!Array.isArray(s.log))s.log=[];s.log=s.log.slice(0,12);return s;
}
function rpsRound(now=gameNow()){const round=Math.floor(now/RPS_MINUTE);return{round,end:(round+1)*RPS_MINUTE,open:now%RPS_MINUTE<55000};}
function rpsRandomHand(){
 // Rejection sampling gives each hand the same probability, without Math.random hooks.
 const n=new Uint32Array(1),max=4294967295;
 do{crypto.getRandomValues(n);}while(n[0]>=max);
 return RPS_HANDS[n[0]%3][0];
}
function rpsOutcome(hand,opponent){return hand===opponent?'draw':RPS_BEATS[hand]===opponent?'win':'lose';}
function rpsPayout(stake,outcome){return outcome==='draw'?stake:outcome==='win'?Math.floor(stake/10)*19+Math.floor(stake%10*19/10):0;}
function rpsStake(value,currency){
 const text=String(value).trim();if(!['gold','knb'].includes(currency)||!/^\d+$/.test(text))return null;
 const amount=Number(text),stake=amount*(currency==='gold'?10000:1);
 return Number.isSafeInteger(amount)&&amount>0&&Number.isSafeInteger(stake)&&stake>0?stake:null;
}
function rpsMoney(amount,currency){return currency==='gold'?fmtMoney(amount):amount.toLocaleString('vi-VN')+' KNB';}
function rpsBalance(currency){const n=S[currency]??0;return Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER&&(currency==='gold'||Number.isSafeInteger(n))?n:null;}
function rpsPlace(hand,value,currency){
 if(!S?.fac)return{ok:false,msg:'Hãy chọn nhân vật trước.'};
 if(!RPS_HANDS.some(h=>h[0]===hand))return{ok:false,msg:'Chọn Kéo, Búa hoặc Bao.'};
 const stake=rpsStake(value,currency),balance=rpsBalance(currency);
 if(stake===null)return{ok:false,msg:'Nhập số nguyên dương theo đơn vị vạn hoặc KNB.'};
 if(balance===null||balance<stake)return{ok:false,msg:'Không đủ '+(currency==='gold'?'ngân lượng':'Kim Nguyên Bảo')+'.'};
 if(stake>Math.floor(Number.MAX_SAFE_INTEGER/2)||balance-stake+rpsPayout(stake,'win')>Number.MAX_SAFE_INTEGER)return{ok:false,msg:'Mức cược vượt giới hạn số tiền có thể lưu an toàn.'};
 const s=rpsState(),r=rpsRound();
 if(s.pending)return{ok:false,msg:'Ván trước đang chờ kết quả.'};
 if(s.lastRound>=r.round)return{ok:false,msg:'Bạn đã đặt ván này. Chờ ván tiếp theo.'};
 if(!r.open)return{ok:false,msg:'Đã khóa cược. Ván mới mở sau vài giây.'};
 let opponent;try{opponent=rpsRandomHand();}catch{return{ok:false,msg:'Chưa tạo được kết quả. Tiền cược chưa bị trừ.'};}
 S[currency]=balance-stake;
 s.pending={round:r.round,end:r.end,hand,opponent,currency,stake};s.lastRound=r.round;R.dirty=true;
 return{ok:true,pending:true,msg:'Đã cược '+rpsMoney(stake,currency)+' · chờ hết phút mở kết quả.'};
}
function rpsSettle(now=gameNow()){
 const s=S?.rps,p=s?.pending;if(!p||now<p.end)return null;
 if(!Number.isSafeInteger(p.round)||p.end!==(p.round+1)*RPS_MINUTE||!RPS_HANDS.some(h=>h[0]===p.hand)||!RPS_HANDS.some(h=>h[0]===p.opponent)||!['gold','knb'].includes(p.currency)||!Number.isSafeInteger(p.stake)||p.stake<=0||p.stake>Math.floor(Number.MAX_SAFE_INTEGER/2))return null;
 const result=rpsOutcome(p.hand,p.opponent),paid=rpsPayout(p.stake,result),balance=rpsBalance(p.currency);
 // If the purse is at its numeric limit, retain the claim instead of losing/duplicating it.
 if(balance===null||!Number.isSafeInteger(paid)||balance+paid>Number.MAX_SAFE_INTEGER)return null;
 S[p.currency]=balance+paid;delete s.pending;
 const hand=id=>RPS_HANDS.find(h=>h[0]===id)[1],delta=paid-p.stake;
 const msg='Bạn: '+hand(p.hand)+' · Máy: '+hand(p.opponent)+' — '+(result==='win'?'Thắng, nhận '+rpsMoney(paid,p.currency):result==='draw'?'Hòa, hoàn '+rpsMoney(p.stake,p.currency):'Thua '+rpsMoney(p.stake,p.currency));
 s.log=[{round:p.round,hand:p.hand,opponent:p.opponent,currency:p.currency,stake:p.stake,paid,result,delta},...(Array.isArray(s.log)?s.log:[])].slice(0,12);R.dirty=true;
 return{ok:true,result,paid,delta,msg};
}
function rpsHTML(){
 const s=rpsState(),p=s.pending;
 if(p&&RPS_HANDS.some(h=>h[0]===p.hand)){rpsHand=p.hand;rpsCurrency=p.currency;rpsAmount=String(p.stake/(p.currency==='gold'?10000:1));}
 return `<section class="rps-game"><h4>Oẳn tù tì · Kéo / Búa / Bao</h4><p>Ván 1 phút · đặt trong 55 giây đầu · mỗi ván đặt một lần · không giới hạn lượt mỗi ngày.</p><div class="card"><b>Luật chơi</b><p>Kéo thắng Bao, Bao thắng Búa, Búa thắng Kéo. Máy chọn ngẫu nhiên, mỗi tay có cơ hội như nhau.</p><p>Thắng nhận <b>×1,9 tiền cược (gồm vốn)</b>; hòa hoàn tiền; thua mất cược. KNB lẻ được làm tròn xuống.</p></div><div class="rps-wallet">${fmtMoney(S.gold||0)} · ${(S.knb||0).toLocaleString('vi-VN')} KNB</div><div class="card"><div id="rpsRound" role="status"></div><div class="rps-form"><label>Loại tiền<select id="rpsCurrency"><option value="gold" ${rpsCurrency==='gold'?'selected':''}>Tiền vạn</option><option value="knb" ${rpsCurrency==='knb'?'selected':''}>Kim Nguyên Bảo</option></select></label><label>Mức cược<input id="rpsAmount" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="16" value="${esc(rpsAmount)}" autocomplete="off"></label></div><small id="rpsStakeHint"></small><div class="rps-hands">${RPS_HANDS.map(([id,name,icon])=>`<button type="button" class="btn ${rpsHand===id?'on':''}" data-rps-hand="${id}" aria-pressed="${rpsHand===id}"><span aria-hidden="true">${icon}</span>${name}</button>`).join('')}</div><button class="btn" id="rpsPlay" ${p?'disabled':''}>${p?'Đã đặt · chờ kết quả':'Đặt cược'}</button><p id="rpsNotice" role="status">${p?'Đã chọn '+RPS_HANDS.find(h=>h[0]===p.hand)?.[1]+' · cược '+rpsMoney(p.stake,p.currency):'Chọn tay và nhập mức cược.'}</p></div><details ${s.log.length?'open':''}><summary>12 ván gần đây</summary><div class="rps-history">${s.log.map(p=>{const own=RPS_HANDS.find(h=>h[0]===p.hand),other=RPS_HANDS.find(h=>h[0]===p.opponent);if(!own||!other||!['gold','knb'].includes(p.currency)||!Number.isFinite(p.delta))return '';return `<div><span>${own[1]} / ${other[1]}</span><b class="${p.result==='win'?'ok':p.result==='lose'?'bad':''}">${p.result==='win'?'Thắng':p.result==='draw'?'Hòa':'Thua'}</b><span>${p.delta>0?'+':p.delta<0?'−':''}${rpsMoney(Math.abs(p.delta),p.currency)}</span></div>`;}).join('')||'<small>Chưa có ván hoàn tất.</small>'}</div></details></section>`;
}
function rpsBind(){
 const currency=document.getElementById('rpsCurrency');if(!currency)return;
 const amount=document.getElementById('rpsAmount'),play=document.getElementById('rpsPlay');
 currency.onchange=()=>{rpsCurrency=currency.value;rpsUpdate();};amount.oninput=()=>{rpsAmount=amount.value;rpsUpdate();};
 document.querySelectorAll('[data-rps-hand]').forEach(b=>b.onclick=()=>{rpsHand=b.dataset.rpsHand;document.querySelectorAll('[data-rps-hand]').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));});});
 play.onclick=()=>{if(play.disabled)return;play.disabled=true;const res=rpsPlace(rpsHand,amount.value,currency.value);document.getElementById('rpsNotice').textContent=res.msg;if(res.ok){save();updateTop();}rpsUpdate();};
 rpsUpdate();
}
function rpsUpdate(){
 const el=document.getElementById('rpsRound');if(!el)return;const r=rpsRound(),p=S.rps?.pending;
 el.textContent=p?'Còn '+Math.max(0,Math.ceil((p.end-gameNow())/1000))+' giây tới kết quả':r.open?'Còn '+Math.ceil((r.end-5000-gameNow())/1000)+' giây đặt cược':'Khóa cược · còn '+Math.ceil((r.end-gameNow())/1000)+' giây mở ván mới';
 const stake=rpsStake(rpsAmount,rpsCurrency),balance=rpsBalance(rpsCurrency),hint=document.getElementById('rpsStakeHint');hint.textContent=stake===null?'Nhập từ 1 '+(rpsCurrency==='gold'?'vạn':'KNB')+'.':'Cược '+rpsMoney(stake,rpsCurrency)+' · thắng nhận '+rpsMoney(rpsPayout(stake,'win'),rpsCurrency);
 const b=document.getElementById('rpsPlay');b.disabled=!!p||!r.open||S.rps?.lastRound>=r.round||stake===null||balance===null||balance<stake||stake>Math.floor(Number.MAX_SAFE_INTEGER/2)||balance-stake+rpsPayout(stake,'win')>Number.MAX_SAFE_INTEGER;b.textContent=p?'Đã đặt · chờ kết quả':'Đặt cược';
 currencyDisabled(!!p);
 function currencyDisabled(v){document.getElementById('rpsCurrency').disabled=v;document.getElementById('rpsAmount').disabled=v;document.querySelectorAll('[data-rps-hand]').forEach(x=>x.disabled=v);}
}
function rpsPulse(){
 if(!S?.fac)return;const sec=Math.floor(gameNow()/1000);if(rpsPulseState===S&&rpsPulseSecond===sec)return;rpsPulseState=S;rpsPulseSecond=sec;
 const result=rpsSettle();if(result){save();updateTop();toast(result.msg);log(esc(result.msg));if(document.getElementById('rpsRound')){giftModal();const notice=document.getElementById('rpsNotice');if(notice)notice.textContent=result.msg;}}
 rpsUpdate();
}
