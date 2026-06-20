// CryptoMind Service Worker — v4
// داده‌های API هرگز cache نمی‌شوند — همیشه live
const CACHE = "cryptomind-v4";
const STATIC = ["/", "/index.html", "/manifest.json", "/sw.js"];

// ── Install: cache فایل‌های استاتیک ──
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// ── Activate: پاک کردن cache قدیمی ──
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: استراتژی هوشمند ──
self.addEventListener("fetch", e => {
  const url = e.request.url;

  // همه API calls → مستقیم از شبکه، هرگز cache نشود
  const isApi = url.includes("coingecko.com")
             || url.includes("metals.live")
             || url.includes("googleapis.com/css");

  if (isApi) {
    e.respondWith(fetch(e.request).catch(() => new Response("", { status: 503 })));
    return;
  }

  // فایل‌های استاتیک → cache-first با fallback به شبکه
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (e.request.method === "GET" && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    }).catch(() => {
      if (e.request.destination === "document") return caches.match("/index.html");
    })
  );
});

// ── SKIP_WAITING ──
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
