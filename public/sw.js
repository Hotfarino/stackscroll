const CACHE="stackscroll-shell-v1";
const CORE=["/","/manifest.webmanifest","/favicon.svg","/brand/stackscroll-mark.svg","/fonts/InterVariable.woff2"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key.startsWith("stackscroll-shell-")).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("message",event=>{if(event.data?.type!=="CACHE_PAGE"||!Array.isArray(event.data.urls))return;const urls=[...new Set(event.data.urls)].filter(url=>{try{const next=new URL(url,self.location.origin);return next.origin===self.location.origin&&!next.pathname.startsWith("/api/");}catch{return false;}});event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(urls.map(url=>cache.add(url)))));});
self.addEventListener("fetch",event=>{
 const request=event.request;if(request.method!=="GET")return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith("/api/"))return;
 if(request.mode==="navigate")event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put("/",copy));return response;}).catch(()=>caches.match("/").then(response=>response||Response.error())));
 else event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response;})));
});
