"use strict";
(()=>{
  const label=document.getElementById('playerOnline'),tabId=crypto.randomUUID();
  let guestId,busy=false,registered=false,retryAt=0,socket=null,nextConnect=0,lastPing=0,socketOwner='';
  window.JXSocialChat=()=>{};
  try{guestId=localStorage.getItem('jxidle_presence_guest');if(!guestId||!/^[a-zA-Z0-9_-]{16,80}$/.test(guestId)){guestId=crypto.randomUUID();localStorage.setItem('jxidle_presence_guest',guestId)}}catch(e){guestId=crypto.randomUUID()}
  const owner=()=>typeof CLOUD!=='undefined'&&CLOUD.ready?CLOUD.user?.id||'guest':'guest';
  const active=()=>typeof S!=='undefined'&&S&&S.fac&&!document.hidden;
  function closeSocket(){const old=socket;socket=null;window.JXSocialConnected=false;if(old)old.close();}
  function connect(){if(socket||Date.now()<nextConnect||typeof WebSocket==='undefined')return;const url=new URL('/api/social',location.href);url.protocol=location.protocol==='https:'?'wss:':'ws:';url.searchParams.set('guestId',guestId);url.searchParams.set('tabId',tabId);socketOwner=owner();let ws;try{ws=socket=new WebSocket(url)}catch{socket=null;nextConnect=Date.now()+60000;return;}lastPing=Date.now();
   ws.onopen=()=>{if(ws!==socket)return;window.JXSocialConnected=true;window.JXSocialChat(open=>{if(ws.readyState===1)ws.send(JSON.stringify({type:'chat',open}))});dispatchEvent(new Event('jx-social-open'));};
   ws.onmessage=e=>{if(ws!==socket)return;try{const data=JSON.parse(e.data);lastPing=Date.now();if(data.type==='online'&&Number.isSafeInteger(data.online)){label.textContent='Online: '+data.online+' người';label.title='Người chơi đang online · mọi map, mọi chế độ';}if(data.type==='chat')dispatchEvent(new CustomEvent('jx-social-chat',{detail:data.messages}));}catch{}};
   ws.onclose=()=>{if(ws!==socket)return;socket=null;window.JXSocialConnected=false;nextConnect=Date.now()+60000;dispatchEvent(new Event('jx-social-close'));};ws.onerror=()=>{try{ws.close()}catch{}};
  }
  function leave(){closeSocket();if(!registered||Date.now()<retryAt)return;registered=false;fetch('/api/presence',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({guestId,tabId,leave:true}),keepalive:true}).catch(()=>{});}
  async function poll(){
    if(!active()){leave();return}if(socket&&(socketOwner!==owner()||socket.readyState===0&&Date.now()-lastPing>15000)){closeSocket();nextConnect=0;}if(socket?.readyState===1){if(Date.now()-lastPing>65000){closeSocket();nextConnect=Date.now()+60000;}else{socket.send(JSON.stringify({type:'heartbeat'}));return;}}connect();if(socket&&socket.readyState===0&&Date.now()-lastPing<10000)return;if(busy||Date.now()<retryAt)return;busy=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{const r=await fetch('/api/presence',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({guestId,tabId}),signal:controller.signal});const data=await r.json();if(!r.ok){retryAt=Date.now()+(Number(data.retryAfter)||30)*1000;throw Error(data.msg||'Chưa kết nối được thống kê online');}if(!Number.isSafeInteger(data.online)||data.online<0)throw Error('count');registered=true;label.textContent='Online: '+data.online+' người';label.title='Người chơi đang online · mọi map, mọi chế độ';if(!active())leave();}
    catch(e){label.textContent='Online: —';label.title=e.message;}
    finally{clearTimeout(timer);busy=false;}
  }
  document.addEventListener('visibilitychange',()=>document.hidden?leave():poll());
  addEventListener('pagehide',leave);addEventListener('pageshow',poll);addEventListener('online',poll);
  setInterval(poll,30000);setTimeout(poll,1000);
})();
