var CACHE_NAME = "dr-oux-v1.0.9";

var urlsToCache = [
  "/favicon.ico",
  "/",
  "/index.html",
  "/assets/manifest/android-add-to-home.json",
  "/assets/css/index.css",
  "/assets/html/app.html",
  "/assets/img/icon-192.png",
  "/assets/img/the-one-sprite.png",
  "/socket.io/socket.io.js",
  "/assets/vendor/js/angular.min.js",
  "/assets/dist.js",
  "/assets/sounds/sfx/combo-1.wav",
  "/assets/sounds/sfx/combo-2.wav",
  "/assets/sounds/sfx/pause.wav",
  "/assets/sounds/sfx/pill-destroy-1.wav",
  "/assets/sounds/sfx/pill-destroy-2.wav",
  "/assets/sounds/sfx/almost_done.wav",
  "/assets/sounds/sfx/warning.mp3",
  "/assets/sounds/sfx/pill-fall.wav",
  "/assets/sounds/sfx/pill-move.wav",
  "/assets/sounds/sfx/pill-rotate.wav",
  "/assets/sounds/bg/wii-02_Title.mp3",
  "/assets/sounds/bg/wii-03_Select.mp3",
  "/assets/sounds/bg/wii-04_Fever.mp3",
  "/assets/sounds/bg/wii-05_Chill.mp3",
  "/assets/sounds/bg/wii-06_Cough.mp3",
  "/assets/sounds/bg/wii-07_Sneeze.mp3",
  "/assets/sounds/bg/wii-clear.mp3",
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
