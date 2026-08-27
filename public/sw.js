const CACHE="becomr-shell-v2";
const CORE=["/","/forge","/manifest.webmanifest","/assets/becomr-compass-tree.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>undefined));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET") return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  // Never cache Next.js runtime/chunks or API responses. Stale framework assets can
  // make a new layout execute against an old Webpack module map after an update.
  if(url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return;

  if(request.mode==="navigate"){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy));
          return response;
        })
        .catch(async()=>{
          const cached=await caches.match(request);
          return cached || caches.match("/");
        })
    );
    return;
  }

  // Static assets use network-first so updates appear immediately while still
  // retaining an offline fallback for previously fetched files.
  event.respondWith(
    fetch(request)
      .then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(request))
  );
});
