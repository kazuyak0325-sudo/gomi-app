const CACHE_NAME = "gomi-app-ao-pet1-1790223214";
const CACHE_PREFIX = "gomi-app-ao-pet1-";
const ASSETS = ["./", "index.html", "manifest.json", "icon.png", "../../style.css?v=1791254928", "../../app.js?v=1791254928", "../../pet-icon.png"];
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k.startsWith(CACHE_PREFIX)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function fallbackResponse(request){
  const cached = await caches.match(request);
  if (cached) return cached;
  if (request.mode === "navigate") {
    const shell = await caches.match(new URL("./", self.registration.scope).href);
    if (shell) return shell;
  }
  return new Response(
    "オフラインです。このページを一度オンラインで開いてから、もう一度お試しください。",
    { status: 504, statusText: "Offline", headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

function networkFirstWithTimeout(request){
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      fallbackResponse(request).then(resolve);
    }, NETWORK_TIMEOUT_MS);

    fetch(request, { cache: "no-store" }).then((response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
      resolve(response);
    }).catch(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fallbackResponse(request).then(resolve);
    });
  });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(networkFirstWithTimeout(event.request));
});