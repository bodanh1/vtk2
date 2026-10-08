"use strict";
const BOT_PARTY_MAX=6,BOT_PARTY_RANGE=800;
const BOT_PARTY={invite:null,nextInvite:0,slot:null};
function botPartyConfig(){
  if(!S.botParty||typeof S.botParty!=='object')S.botParty={members:[],lootTurn:0,invites:true,history:[]};
  const p=S.botParty,cfg=botConfig(),active=new Set(cfg.on?cfg.list.map(b=>b.id):[]);
  p.members=[...new Set(Array.isArray(p.members)?p.members:[])].filter(id=>active.has(id)).slice(0,BOT_PARTY_MAX-1);
  p.lootTurn=Math.max(0,Math.floor(+p.lootTurn||0));
  p.history=Array.isArray(p.history)?p.history.slice(-8):[];
  if(p.invites===undefined)p.invites=true;
  if(BOT_PARTY.invite&&!active.has(BOT_PARTY.invite.id))BOT_PARTY.invite=null;
  return p;
}
const botInParty=id=>botPartyConfig().members.includes(id);
function partyAddBot(id,invited=false){
  const p=botPartyConfig(),b=botConfig().list.find(b=>b.id===id);
  if(!botConfig().on||!b||p.members.includes(id))return;
  if(p.members.length>=BOT_PARTY_MAX-1){toast('Tổ đội đã đủ 6 thành viên');return}
  if(!p.members.length)p.leader=invited?id:'player';
  p.members.push(id);BOT_PARTY.invite=null;save();toast(b.name+' đã vào tổ đội');botPartyModal();
}
function partyLeaveBot(id){const p=botPartyConfig();p.members=p.members.filter(v=>v!==id);if(p.leader===id)p.leader='player';save();botPartyModal()}
function partyDismiss(){const p=botPartyConfig();p.members=[];p.leader='player';BOT_PARTY.invite=null;save();botPartyModal()}
function partyInviteCheck(){
  if(typeof S==='undefined'||!S||!S.fac)return;
  const now=Date.now(),slot=saveKey();
  if(BOT_PARTY.slot!==slot){BOT_PARTY.slot=slot;BOT_PARTY.invite=null;BOT_PARTY.nextInvite=now+30000}
  const p=botPartyConfig();
  if(BOT_PARTY.invite&&BOT_PARTY.invite.until<now)BOT_PARTY.invite=null;
  const button=$('#jxParty');if(button)button.classList.toggle('on',!!BOT_PARTY.invite);
  if(!p.invites||!botsAvailable()||p.members.length>=BOT_PARTY_MAX-1||BOT_PARTY.invite||now<BOT_PARTY.nextInvite||document.hidden)return;
  BOT_PARTY.nextInvite=now+60000;
  const nearby=botActors().filter(b=>b.deadT<=0&&b.hp>0&&!p.members.includes(b.data.id)&&Math.hypot(b.x-H.x,b.y-H.y)<=BOT_PARTY_RANGE);
  if(!nearby.length)return;
  const b=pick(nearby);BOT_PARTY.invite={id:b.data.id,name:b.data.name,until:now+60000};
  toast(b.data.name+' mời bạn vào tổ đội. Mở Tổ đội để trả lời.');if(button)button.classList.add('on');
}
setInterval(partyInviteCheck,1000);
function partyRecipients(e){
  if(!botsAvailable()||R.deadT>0||R.life<=0||Math.hypot(e.x-H.x,e.y-H.y)>BOT_PARTY_RANGE)return [];
  const p=botPartyConfig();if(!p.members.length)return [];
  const members=botActors().filter(b=>p.members.includes(b.data.id)&&b.deadT<=0&&b.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<=BOT_PARTY_RANGE);
  if(!members.length)return [];
  if(e.botFinisher&&!e.heroTagged&&!members.some(b=>b.data.id===e.botFinisher))return [];
  return [{id:'player',name:S.name||'Bạn'},...members.map(b=>({id:b.data.id,name:b.data.name,actor:b,data:b.data}))];
}
function partyShareKill(e){
  const recipients=partyRecipients(e);if(!recipients.length)return false;
  const count=recipients.length,base=expFor(e.L)*CLS[e.cls].xp*ctcBossXp(e)*diffOf().rew;
  const diff=e.L-S.lvl,penalty=diff<-10?.2:diff<-5?.6:1;
  R.jrOn=true;try{gainXp(base*ctcManualXp()*penalty/count)}finally{R.jrOn=false}
  const totalGold=Math.round(moneyDrop(e)*diffOf().rew*modeGoldMul());
  recipients.forEach((member,index)=>{
    const gold=Math.floor(totalGold/count)+(index<totalGold%count?1:0);
    if(member.id==='player'){S.gold+=gold;jrAdd('gold',gold);jrAdd('kills',1)}
    else {const b=member.data;b.kills++;b.gold=Math.max(0,+b.gold||0)+gold;b.xp+=base/count*modeXpMul()*(1+(member.actor.profile.P.xpBonus||0)/100)/xpSlow(b.lvl);while(b.lvl<MAX_LEVEL&&b.xp>=expNeed(b.lvl)){b.xp-=expNeed(b.lvl);b.lvl++}}
  });
  const drops=rollDrops(e),special=rollSetDrop(e);if(special)drops.push(special);
  const p=botPartyConfig();
  for(const it of drops){
    const owner=recipients[p.lootTurn++%count];
    if(owner.id==='player'){
      dropToGround(it,e);
      if(typeof ytGearMatch==='function'&&ytGearMatch(it)){ytTick('gear');log('<b class="up">Dã Tẩu:</b> tìm thấy '+esc(it.n))}
    } else {
      const b=owner.data;b.bag=Array.isArray(b.bag)?b.bag:[];b.bag.push(it);
      while(b.bag.length>20)b.gold=(+b.gold||0)+itemValue(b.bag.shift());
    }
    p.history.push(owner.name+' nhận '+it.n);
    log('<span class="dim">Tổ đội: '+esc(owner.name)+' nhận '+esc(it.n)+'.</span>');
  }
  // Vật liệu cũng được phân cho một thành viên theo lượt; dùng kho riêng của người nhận.
  const owner=recipients[p.lootTurn%count];let materials;
  if(owner.id==='player')materials=allDrops(e);
  else {
    const player=S,stats=R.P;
    try{S=owner.actor.profile.state;R.P=owner.actor.profile.P;S.mats=owner.data.mats||(owner.data.mats=S.mats);materials=allDrops(e)}finally{S=player;R.P=stats}
  }
  if(materials.length){p.lootTurn++;const text=owner.name+' nhận '+materials.join(', ');p.history.push(text);log('<span class="dim">Tổ đội: '+esc(text)+'.</span>')}
  p.history=p.history.slice(-8);
  return true;
}
function botPartyModal(){
  const p=botPartyConfig(),cfg=botConfig(),joined=new Set(p.members);
  const nearby=botActors().filter(b=>b.hp>0&&b.deadT<=0&&Math.hypot(b.x-H.x,b.y-H.y)<=BOT_PARTY_RANGE&&!joined.has(b.data.id));
  const invite=BOT_PARTY.invite&&BOT_PARTY.invite.until>Date.now()?BOT_PARTY.invite:null;
  const leader=cfg.list.find(b=>b.id===p.leader);
  modal(`<h3>Tổ đội <small>${p.members.length?1+p.members.length:0}/${BOT_PARTY_MAX}</small></h3>
    <p class="desc">Mời nhân vật gần bạn cùng cày. Thành viên còn sống trong tầm ${BOT_PARTY_RANGE} nhận EXP và ngân lượng chia đều; đồ rơi chia luân phiên. Đồng đội sẽ chạy tới hỗ trợ bạn.</p>
    <div class="btnrow"><button class="btn" id="partyRefresh">Làm mới</button><button class="btn red" id="partyDismiss" ${p.members.length?'':'disabled'}>Rời tổ đội</button><button class="btn ${p.invites?'on':''}" id="partyInvites">Bot mời: ${p.invites?'Bật':'Tắt'}</button></div>
    ${invite?`<div class="card"><b>${esc(invite.name)} mời bạn vào tổ đội</b><div class="btnrow"><button class="btn" id="partyAccept">Chấp nhận</button><button class="btn red" id="partyDecline">Từ chối</button></div></div>`:''}
    ${p.members.length?`<h4>Thành viên · Đội trưởng: ${esc(leader?leader.name:S.name||'Bạn')}</h4><div class="partyrow"><b>${esc(S.name||'Bạn')}</b><small>Cấp ${S.lvl}</small></div>${p.members.map(id=>{const b=cfg.list.find(b=>b.id===id),a=TRAIN_BOTS.actors.get(id);return `<div class="partyrow"><span><b>${esc(b.name)}</b><small>${a&&a.deadT>0?'Đang hồi sinh':a&&Math.hypot(a.x-H.x,a.y-H.y)<=BOT_PARTY_RANGE?'Ở gần':'Đang tới'} · Cấp ${b.lvl} · Nhận ${Array.isArray(b.bag)?b.bag.length:0} món</small></span><button class="btn sm" data-party-remove="${esc(id)}">Rời nhóm</button></div>`}).join('')}`:'<p class="desc">Bạn chưa có tổ đội.</p>'}
    <h4>Nhân vật xung quanh</h4>${nearby.map(b=>`<div class="partyrow"><span><b>${esc(b.data.name)}</b><small>Cấp ${b.data.lvl}</small></span><button class="btn sm" data-party-add="${esc(b.data.id)}" ${p.members.length>=BOT_PARTY_MAX-1?'disabled':''}>Mời</button></div>`).join('')||'<p class="desc">Chưa có nhân vật ở gần. Bật hoặc thêm bot tại Menu bot.</p>'}
    ${p.history.length?`<h4>Chia đồ gần đây</h4>${p.history.map(t=>`<p class="desc">${esc(t)}</p>`).join('')}`:''}`,()=>{
      $('#partyRefresh').onclick=botPartyModal;$('#partyDismiss').onclick=partyDismiss;
      $('#partyInvites').onclick=()=>{p.invites=!p.invites;if(!p.invites)BOT_PARTY.invite=null;save();botPartyModal()};
      if(invite){$('#partyAccept').onclick=()=>partyAddBot(invite.id,true);$('#partyDecline').onclick=()=>{BOT_PARTY.invite=null;BOT_PARTY.nextInvite=Date.now()+60000;botPartyModal()}}
      document.querySelectorAll('[data-party-add]').forEach(b=>b.onclick=()=>partyAddBot(b.dataset.partyAdd));
      document.querySelectorAll('[data-party-remove]').forEach(b=>b.onclick=()=>partyLeaveBot(b.dataset.partyRemove));
    });
}
function partyAllowsPlayerReward(e){
  if(!e.botFinisher||!botInParty(e.botFinisher))return true;
  return partyRecipients(e).some(member=>member.id==='player');
}
