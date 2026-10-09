"use strict";
(()=>{
  const label=document.getElementById('playerOnline'),tabId=crypto.randomUUID();
  let guestId,busy=false,registered=false;
  try{guestId=localStorage.getItem('jxidle_presence_guest');if(!guestId||!/^[a-zA-Z0-9_-]{16,80}$/.test(guestId)){guestId=crypto.randomUUID();localStorage.setItem('jxidle_presence_guest',guestId)}}catch(e){guestId=crypto.randomUUID()}
  const active=()=>typeof S!=='undefined'&&S&&S.fac&&!document.hidden;
  function leave(){if(!registered)return;registered=false;fetch('/api/presence',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({guestId,tabId,leave:true}),keepalive:true}).catch(()=>{});}
  async function poll(){
    if(!active()){leave();return}if(busy)return;busy=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{const r=await fetch('/api/presence',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({guestId,tabId}),signal:controller.signal});if(!r.ok)throw Error('presence');const data=await r.json();if(!Number.isSafeInteger(data.online)||data.online<0)throw Error('count');registered=true;label.textContent='Online: '+data.online+' người';label.title='Người chơi đang online · mọi map, mọi chế độ';if(!active())leave();}
    catch(e){label.textContent='Online: —';label.title='Chưa kết nối được thống kê online';}
    finally{clearTimeout(timer);busy=false;}
  }
  document.addEventListener('visibilitychange',()=>document.hidden?leave():poll());
  addEventListener('pagehide',leave);addEventListener('pageshow',poll);addEventListener('online',poll);
  setInterval(poll,10000);setTimeout(poll,1000);
})();
