// CryptoMind Service Worker — v7
const CACHE = "cryptomind-v7";
const STATIC = ["/", "/index.html", "/manifest.json", "/sw.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = e.request.url;
  const isApi = url.includes("coingecko.com") || url.includes("open.er-api.com") || url.includes("frankfurter.app") || url.includes("googleapis.com/css");
  if (isApi) { e.respondWith(fetch(e.request).catch(()=>new Response("",{status:503}))); return; }
  e.respondWith(caches.match(e.request).then(c=>{
    if(c) return c;
    return fetch(e.request).then(r=>{if(e.request.method==="GET"&&r.status===200)caches.open(CACHE).then(ca=>ca.put(e.request,r.clone()));return r;});
  }).catch(()=>{if(e.request.destination==="document")return caches.match("/index.html");}));
});
self.addEventListener("message",e=>{if(e.data?.type==="SKIP_WAITING")self.skipWaiting();});
