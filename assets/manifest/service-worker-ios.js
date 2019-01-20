var CACHE_NAME = "dr-oux-v1.1.5";

var urlsToCache = [
    '/favicon.ico',
    '/',
    '/index.html',
    '/assets/manifest/android-add-to-home.json',
    '/assets/css/index.css',
    '/assets/html/app.html',
    '/assets/img/icon-192.png',
    '/assets/img/the-one-sprite.png',
    '/socket.io/socket.io.js',
    '/assets/vendor/js/angular.min.js',
    '/assets/dist-ios.js',
    '/assets/sounds/bg-wii.mp3',
    '/assets/sounds/sfx.mp3'
];

function postMessage(msg) {
  self.clients.matchAll().then(function (clients){
    clients.forEach(function(client){
      client.postMessage(msg);
    });
  });
}


function cleanCache() {
  return caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        if (cacheName != CACHE_NAME) {
          console.log('Deleting out of date cache:', cacheName);
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      })
    );
  });
}

function updateCache(cache) {
  var done = 0;
  var total = urlsToCache.length;
  return caches.open(CACHE_NAME).then(function(cache){
    return Promise.all(urlsToCache.map(function(url){
      return cache.add(url)
      .then(function(){
        postMessage({event:"update_progress",data:{
          total:total,
          done:done++
        }});
      });
    }));
  })
}

self.addEventListener("install", function(event) {
  // Perform install steps
  event.waitUntil(
    cleanCache()
    .then(updateCache)
    .then(function(){
      self.skipWaiting();
    })
  );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
