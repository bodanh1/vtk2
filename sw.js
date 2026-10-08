// Mang truoc, cache du phong: luon lay ban moi khi co mang, choi offline khi mat mang
// QA-021: truoc day ten cache co dinh 'jxidle-v1' va khong precache -> co the phuc vu HTML cu tro toi JS moi.
const C = 'jxidle-v29';   // v25: tai khoan va dong bo cloud, khoi phuc storage an toan
const CORE = ['./index.html', './style.css', './ui/jx2.css?v=28', './js/action-collapse.js?v=2', './js/jxshell.js?v=24', './js/ui.js?v=24', './manifest.json', './js/core.js', './js/main.js', './js/bot-party.js?v=28', './js/modes.js?v=27', './js/quick.js?v=27', './js/cloud-storage.js?v=1', './js/cloud-account.js?v=3', './ui/cloud-account.css?v=1', './js/online.js?v=25', './ref.js', './data.js', './world.js'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(C).then(c => c.addAll(CORE)).catch(() => caches.open(C))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin || u.pathname.startsWith('/api/')) return;   // API online va tai nguyen ngoai: khong cache
  const layMang = () => fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); } return r; });
  if (req.mode === 'navigate') {                      // dieu huong: mang truoc, offline thi lay ban da luu
    e.respondWith(layMang().catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(layMang().catch(() => caches.match(req)));
});
