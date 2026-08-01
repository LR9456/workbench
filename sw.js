// Service Worker: 缓存 personal.html 实现离线访问
const CACHE_NAME = 'workbench-v5';
const CACHE_URL = 'https://lr9456.github.io/workbench/personal.html';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([CACHE_URL, '/workbench/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request).then(function(resp) {
        if(e.request.url.indexOf('personal.html') >= 0) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, respClone); });
        }
        return resp;
      }).catch(function() {
        return caches.match(CACHE_URL);
      });
    })
  );
});
