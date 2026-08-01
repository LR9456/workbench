// Service Worker: 缓存工作台页面实现离线访问
// 使用相对路径，适配任何托管域名
const CACHE_NAME = 'workbench-v6';
const CACHE_FILES = [
  './',
  './personal.html',
  './install.html'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES).catch(function(){});
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
  // 只处理 GET 请求
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // 有缓存就先用缓存（快速），同时后台更新
      if (cached) {
        // 后台静默更新缓存
        fetch(e.request).then(function(resp) {
          if (resp && resp.status === 200) {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, respClone); });
          }
        }).catch(function(){});
        return cached;
      }
      // 没缓存就尝试网络
      return fetch(e.request).then(function(resp) {
        // 缓存成功的响应
        if (resp && resp.status === 200) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, respClone); });
        }
        return resp;
      }).catch(function() {
        // 网络也失败，尝试返回缓存的 personal.html 作为兜底
        return caches.match('./personal.html');
      });
    })
  );
});
