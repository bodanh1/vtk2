import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
function setup(mode='g2'){
 let now=600000,random=0,dice=[1,2,3],saveCount=0;
 const c={S:{fac:'shaolin',mode,lvl:100,gold:10000000,knb:100,rw:{}},R:{dirty:false},crypto:{getRandomValues(a){a[0]=random;return a;}},gameNow:()=>now,localISODay:()=>String(Math.floor(now/86400000)),MC:()=>({tx:mode==='ctc'?0:mode==='phlt'?3:20}),modeBlockMsg:()=> 'Chế độ không hỗ trợ',fmt:String,fmtMoney:n=>n+' lượng',esc:String,rcInt:()=>dice.shift(),irnd:()=>1,matAdd(){c.bonus=(c.bonus||0)+1;},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),RW:()=>c.S.rw,expNeed:()=>100,save(){saveCount++;},updateTop(){},toast(){},log(){},giftModal(){},document:{getElementById:()=>null},Uint32Array};
 vm.createContext(c);const src=fs.readFileSync('js/rewards.js','utf8');vm.runInContext(src.slice(src.indexOf('const TX_BO_BA'),src.indexOf('function giftBody')),c);vm.runInContext(fs.readFileSync('js/rps.js','utf8'),c);
 return{c,time:n=>now=n,random:n=>random=n,dice:ns=>dice=ns.slice(),saves:()=>saveCount};
}
test('RPS all nine pairs pay the correct currency, return draws and settle exactly once',()=>{
 const hands=['keo','bua','bao'];for(const currency of ['gold','knb'])for(const hand of hands)for(let i=0;i<3;i++){
  const{c,time,random}=setup();random(i);const before=c.S[currency],other=currency==='gold'?'knb':'gold',untouched=c.S[other],stake=currency==='gold'?100000:10;
  assert.equal(c.rpsPlace(hand,'10',currency).ok,true);assert.equal(c.S[currency],before-stake);assert.equal(c.rpsPlace(hand,'10',currency).ok,false);
  time(659999);assert.equal(c.rpsSettle(),null);time(660000);const result=c.rpsSettle(),outcome=c.rpsOutcome(hand,hands[i]);assert.equal(result.result,outcome);assert.equal(result.paid,outcome==='win'?stake*1.9:outcome==='draw'?stake:0);assert.equal(c.S[currency],before-stake+result.paid);assert.equal(c.S[other],untouched);assert.equal(c.rpsSettle(),null);assert.equal(c.S.rps.log.length,1);
 }
});
test('pending stake survives closing/reloading/switching character and pays only its saved character',()=>{
 const{c,time,random}=setup();random(2);c.rpsPlace('keo','10','knb');const snapshot=JSON.stringify(c.S),own=c.S;c.S={fac:'shaolin',gold:999,knb:99};time(660000);assert.equal(c.rpsSettle(),null);assert.equal(c.S.knb,99);c.S=JSON.parse(snapshot);assert.equal(c.rpsSettle().paid,19);assert.equal(c.S.knb,109);const settled=JSON.stringify(c.S);c.S=JSON.parse(settled);assert.equal(c.rpsSettle(),null);assert.equal(c.S.knb,109);assert.equal(own.knb,90);
});
test('arbitrary positive whole van or KNB, invalid stakes/funds/overflow and locked 5seconds cannot debit',()=>{
 const{c,time}=setup();for(const value of ['0','-1','1.5','1e3','NaN','Infinity','',null,Number.MAX_SAFE_INTEGER]){const before=JSON.stringify(c.S);assert.equal(c.rpsPlace('keo',value,'knb').ok,false);assert.equal(JSON.stringify(c.S),before);}assert.equal(c.rpsPlace('bad','1','knb').ok,false);assert.equal(c.rpsPlace('keo','1','bad').ok,false);assert.equal(c.rpsPlace('keo','101','knb').ok,false);assert.equal(c.rpsPlace('keo','1001','gold').ok,false);time(655000);assert.equal(c.rpsPlace('keo','1','knb').ok,false);time(660000);assert.equal(c.rpsPlace('keo','1','knb').ok,true);
 const q=setup();q.c.S.gold=Number.MAX_SAFE_INTEGER;assert.equal(q.c.rpsPlace('keo','1','gold').ok,false);assert.equal(q.c.S.gold,Number.MAX_SAFE_INTEGER);
});
test('RPS has no daily cap, history stays bounded and the UI pulse does not resave settled rounds',()=>{
 for(const mode of ['ctc','phlt','g2']){const{c,time,random,saves}=setup(mode);random(0);for(let i=0;i<101;i++){time(600000+i*60000);assert.equal(c.rpsPlace('bua','1','knb').ok,true);time(660000+i*60000);c.rpsPulse();c.rpsPulse();assert.equal(saves(),i+1);}assert.equal(c.S.knb,100);assert.equal(c.S.rps.log.length,12);}
});
test('random generator error does not lose a stake; uniform rejection sampling rejects the biased extra uint',()=>{
 const{c}=setup();c.crypto.getRandomValues=()=>{throw Error('crypto');};assert.equal(c.rpsPlace('keo','10','knb').ok,false);assert.equal(c.S.knb,100);assert.equal(c.S.rps.pending,undefined);let n=0;c.crypto.getRandomValues=a=>{a[0]=n++===0?4294967295:2;return a;};assert.equal(c.rpsRandomHand(),'bao');assert.equal(n,2);
});
test('overflow during pending result retains the payout claim; spending later permits one settlement',()=>{
 const{c,time,random}=setup();random(2);c.rpsPlace('keo','10','knb');time(660000);c.S.knb=Number.MAX_SAFE_INTEGER;assert.equal(c.rpsSettle(),null);assert.ok(c.S.rps.pending);c.S.knb=10;assert.equal(c.rpsSettle().paid,19);assert.equal(c.S.knb,29);assert.equal(c.rpsSettle(),null);
});
test('Tài Xỉu keeps the original216outcomes, multipliers, bonuses, stake limits and20/3daily caps',()=>{
 const wins={tai:0,xiu:0,boba:0};for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let d=1;d<=6;d++)for(const hand of Object.keys(wins)){const q=setup();q.dice([a,b,d]);const before=q.c.S.gold,res=q.c.taiXiu(hand,42000);assert.equal(res.ok,true);if(res.thang){wins[hand]++;assert.equal(q.c.S.gold,before+42000*(hand==='boba'?29:1));assert.equal(q.c.bonus,1);}else{assert.equal(q.c.S.gold,before-42000);assert.equal(q.c.bonus,undefined);}assert.equal(q.c.S.rw.tx.luot,1);assert.ok(q.c.R.dirty);}assert.deepEqual(wins,{tai:105,xiu:105,boba:6});
 for(const [mode,max] of [['g2',20],['phlt',3],['ctc',0]]){const q=setup(mode);for(let i=0;i<max;i++){q.dice([1,2,3]);assert.equal(q.c.taiXiu('xiu',42000).ok,true);}const before=q.c.S.gold;q.dice([1,2,3]);assert.equal(q.c.taiXiu('xiu',42000).ok,false);assert.equal(q.c.S.gold,before);q.time(86400000);q.dice([1,2,3]);assert.equal(q.c.taiXiu('xiu',42000).ok,max>0);}
});
test('Tài Xỉu invalid/overflow/RNGerror or rapid clicks after cap never consume extra funds or turns',()=>{
 const{c,dice}=setup();for(const value of [NaN,Infinity,-1,0,1.5,41999,420001,'42000']){assert.equal(c.taiXiu('tai',value).ok,false);assert.equal(c.S.gold,10000000);}assert.equal(c.taiXiu('bad',42000).ok,false);c.rcInt=()=>{throw Error('RNG');};assert.equal(c.taiXiu('tai',42000).ok,false);assert.equal(c.S.rw.tx.luot,0);assert.equal(c.S.gold,10000000);c.rcInt=()=>7;assert.equal(c.taiXiu('tai',42000).ok,false);assert.equal(c.S.rw.tx.luot,0);c.S.gold=Number.MAX_SAFE_INTEGER;assert.equal(c.taiXiu('boba',42000).ok,false);assert.equal(c.S.gold,Number.MAX_SAFE_INTEGER);
 const q=setup();for(let i=0;i<100;i++){q.dice([1,2,3]);q.c.taiXiu('tai',42000);}assert.equal(q.c.S.rw.tx.luot,20);assert.equal(q.c.S.gold,10000000-20*42000);
 const src=fs.readFileSync('js/rewards.js','utf8');assert.ok(src.includes('if(x.disabled||!x.isConnected)return;x.disabled=true;'));
});
test('Quà places RPS beside existing Tài Xỉu and reuses the existing pulse without polling',()=>{
 assert.match(fs.readFileSync('js/uihub.js','utf8'),/"event","tx","rps","stable"/);assert.match(fs.readFileSync('js/rewards.js','utf8'),/if\(giftTab==="rps"\)return rpsHTML\(\)/);const src=fs.readFileSync('js/rps.js','utf8');assert.doesNotMatch(src,/setInterval|fetch\(/);assert.match(fs.readFileSync('ui/jx2.css','utf8'),/\.rps-form input,\.rps-form select\{[^}]*font-size:16px/);
});
test('queued double clicks on the same rendered Tài Xỉu button create one completed bet and log entry',()=>{
 const{c,dice}=setup();dice([1,2,3]);const button={disabled:false,isConnected:true,dataset:{tx:'xiu:42000'}},src=fs.readFileSync('js/rewards.js','utf8').trim(),start=src.indexOf('document.querySelectorAll("#mBody [data-tx]")');
 c.document.querySelectorAll=()=>[button];let refreshed=0;c.afterRc=()=>{refreshed++;button.isConnected=false;};vm.runInContext(src.slice(start,-3),c);button.onclick();button.onclick();button.onclick();assert.equal(refreshed,1);assert.equal(c.S.rw.tx.luot,1);assert.equal(c.S.rw.txLog.length,1);assert.equal(c.S.gold,10000000+42000);
});
