const CACHE_NAME = "gomi-app-kiiro-picker-v1";
const CACHE_PREFIX = "gomi-app-kiiro-picker-";
const ASSETS = ["./", "index.html", "icon.png"];

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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          const shell = await caches.match(new URL("./", self.registration.scope).href);
          if (shell) return shell;
        }
        return new Response(
          "オフラインです。このページを一度オンラインで開いてから、もう一度お試しください。",
          { status: 504, statusText: "Offline", headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      })
  );
});
