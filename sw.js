// Mang truoc, cache du phong: luon lay ban moi khi co mang, choi offline khi mat mang
// QA-021: truoc day ten cache co dinh 'jxidle-v1' va khong precache -> co the phuc vu HTML cu tro toi JS moi.
const C = 'jxidle-v100';   // v40: cap nhat bieu tuong Tien Thao Lo trong cua hang Bao vat
const CORE = ['./js/black-market.js?v=93', './ui/black-market.css?v=93', './fx.js?v=90', './js/uihub.js?v=86', './js/jianghu-expansion.js?v=96', './js/mask-data.js?v=83', './js/masks.js?v=85', './ui/masks.css?v=83', './js/ge_patch.js?v=82', './js/vi_names.js?v=82', './js/skill-scroll.js?v=74', './js/account-admin.js?v=73', './ui/account-admin.css?v=73', './js/control.js?v=69', './js/client-shadow-data.js?v=64', './js/client-shadow.js?v=64', './js/loot.js?v=92', './js/gear_policy.js?v=92', './js/horse-shop-data.js?v=65', './js/shop.js?v=65', './index.html', './style.css?v=91', './ui/jx2.css?v=87', './js/action-collapse.js?v=2', './js/jxshell.js?v=68', './js/ui.js?v=92', './js/inventory-menu.js?v=68', './manifest.json', './js/jxorig.js?v=83', './ui/jx/jx_win.css?v=79', './ui/kim-nguyen-bao.svg', './img/i/tien-thao-lo.png', './js/save.js?v=82', './js/rewards.js?v=85', './js/treasure-shop.js?v=83', './js/player-presence.js?v=41', './js/player-rankings.js?v=42', './js/mount-skill-data.js?v=83', './js/mount-rules.js?v=68', './js/mount-rig-data.js?v=62', './js/mount-rig.js?v=83', './js/mount-render.js?v=83', './img/mount-horse-armored.png', './img/mount-horse-gallop.png', './js/mount-ui.js?v=68', './js/doll.js?v=66', './js/stats.js?v=68', './js/core.js?v=46', './js/main.js?v=71', './js/render.js?v=90', './js/combat.js?v=85', './js/survival.js?v=68', './js/train-bots.js?v=83', './js/bot-party.js?v=38', './js/modes.js?v=27', './js/quick.js?v=46', './js/cloud-storage.js?v=1', './js/cloud-account.js?v=94', './ui/cloud-account.css?v=1', './js/online.js?v=95', './ref.js', './data.js', './world.js'];
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
