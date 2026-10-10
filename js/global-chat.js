"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const toggle = $('globalChatToggle'), panel = $('globalChat'), list = $('globalChatMessages');
  const status = $('globalChatStatus'), form = $('globalChatForm'), input = $('globalChatInput');
  let open = false, timer = null, reading = false, sending = false, cursor = 0, controller = null;
  let retryAt=0,retryMsg='';
  const seen = new Set();
  const ready = () => typeof S !== 'undefined' && S && S.fac;
  const key = () => saveKey() + '_global_chat_social_v1';
  const identity = () => { try { const value = JSON.parse(localStorage.getItem(key()) || 'null'); return value && value.name === S.name ? value : null } catch { return null } };
  const api = async (path, body, token, signal) => {
    if(Date.now()<retryAt)throw {msg:retryMsg,retryAfter:Math.ceil((retryAt-Date.now())/1000)};
    const headers = {};
    if (body) headers['content-type'] = 'application/json';
    if (token) headers.authorization = 'Bearer ' + token;
    const response = await fetch((window.JX_CHAT_API || window.JX_API || 'https://game.vltk.workers.dev') + '/api' + path, {method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined, signal});
    const data = await response.json();
    if (!response.ok) {if(data.retryAfter){retryAt=Date.now()+data.retryAfter*1000;retryMsg=data.msg;}throw { code: data.error, msg: data.msg || 'Chưa kết nối được chat',retryAfter:data.retryAfter };}
    return data;
  };
  function append(messages) {
    const bottom = list.scrollHeight - list.scrollTop - list.clientHeight < 45;
    for (const message of messages) {
      if (seen.has(message.id)) continue;
      seen.add(message.id); cursor = Math.max(cursor, message.id);
      const row = document.createElement('p'), time = document.createElement('time'), name = document.createElement('b');
      time.textContent = new Date(message.at).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
      name.textContent = message.name + ' #' + message.sender.slice(-4) + ': ';
      row.append(time, name, document.createTextNode(message.text));
      row.dataset.id = message.id; list.appendChild(row);
    }
    while (list.children.length > 150) { seen.delete(Number(list.firstChild.dataset.id)); list.firstChild.remove() }
    if (bottom) list.scrollTop = list.scrollHeight;
  }
  async function poll() {
    clearTimeout(timer);
    if (!open || document.hidden || reading) return;
    reading = true; controller = new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 12000);
    let delay = 4000;
    try {
      const data = await api('/chat?after=' + cursor, null, null, controller.signal);
      if (open) { append(data.messages); status.textContent = 'Mọi map · mọi chế độ' }
    } catch (error) {
      delay = Math.max(10000,(error.retryAfter||0)*1000);
      if (open) status.textContent = error.msg||'Mất kết nối chat, đang thử lại…';
    } finally {
      clearTimeout(timeout); reading = false; controller = null;
      if (open && !document.hidden&&!window.JXSocialConnected) timer = setTimeout(poll, delay);
    }
  }
  function setOpen(value) {
    if (value && !ready()) return;
    open = value; panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    window.JXSocialChat?.(open);
    if (open) poll(); else { clearTimeout(timer); controller?.abort() }
  }
  addEventListener('jx-social-chat',e=>{if(open&&Array.isArray(e.detail))append(e.detail)});
  addEventListener('jx-social-open',()=>{window.JXSocialChat?.(open);if(open)poll()});
  addEventListener('jx-social-close',()=>{if(open)poll()});
  toggle.onclick = () => setOpen(!open);
  $('globalChatClose').onclick = () => setOpen(false);
  // Chat consumes input so movement/skill shortcuts and arena targeting do not fire.
  for (const target of [panel, toggle])
    for (const event of ['pointerdown','pointerup','click','keydown','keyup'])
      target.addEventListener(event, e => e.stopPropagation());
  input.addEventListener('keydown', e => { if (e.key === 'Escape') { setOpen(false); toggle.focus() } });
  form.onsubmit = async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!ready() || !text || sending) return;
    sending = true; const submit = form.querySelector('button'); submit.disabled = true;
    const slotKey = key(), playerName = S.name;
    try {
      let session = identity();
      if (!session) {
        session = await api('/chat/session', { name: playerName || 'Thiếu hiệp' });
        session.name = playerName;
        try { localStorage.setItem(slotKey, JSON.stringify(session)) } catch {}
      }
      await api('/chat', {text}, session.token);
      // Fetch the cursor stream instead of skipping messages posted by others while sending.
      if (input.value.trim() === text) input.value = '';
      status.textContent = 'Đã gửi tin nhắn';
      if (open && !reading) poll();
    } catch (error) {
      status.textContent = error.msg || 'Không gửi được tin nhắn, hãy thử lại';
      if (error.code === 'bad_token') { try { localStorage.removeItem(slotKey) } catch {} }
    } finally { sending = false; submit.disabled = false }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(timer); controller?.abort() } else if (open) poll() });
})();
