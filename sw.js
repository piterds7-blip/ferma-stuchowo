const CACHE_NAME='stuchowo-v2';
const ASSETS=['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
const CDN=[
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>
    cache.addAll(ASSETS).then(()=>Promise.all(CDN.map(u=>
      fetch(u,{mode:'cors'}).then(r=>r.ok?cache.put(u,r):null).catch(()=>null))))
  ));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // CDN libs: cache-first (offline support for xlsx/chart)
  if(CDN.some(u=>e.request.url.startsWith(u.split('?')[0]))){
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
      const cl=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,cl));return r})));
    return;
  }
  if(url.origin!==location.origin)return;
  // App files: network-first
  e.respondWith(fetch(e.request).then(r=>{
    const cl=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,cl));return r
  }).catch(()=>caches.match(e.request)));
});
