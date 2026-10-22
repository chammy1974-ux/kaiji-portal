/* 海事代理士会ポータル Service Worker
   ビルドごとに CACHE 名が変わり、古いキャッシュは activate で削除されます。 */
const CACHE='kaiji-portal-4c52d45107';
const CORE=['./','./index.html','./manifest.webmanifest'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
      .then(()=>self.clients.matchAll({type:'window'}))
      .then(cs=>cs.forEach(c=>c.postMessage({type:'RELOAD'})))
      .catch(()=>{})
  );
});

self.addEventListener('message',e=>{ if(e.data&&e.data.type==='SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin!==location.origin) return;

  const isDoc = r.mode==='navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html');
  if(isDoc){
    e.respondWith(
      fetch(r,{cache:'no-store'})
        .then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put('./index.html',cp)); return res; })
        .catch(()=>caches.match('./index.html').then(h=>h||caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(r).then(hit=>hit||fetch(r).then(res=>{
      if(res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); }
      return res;
    }))
  );
});
