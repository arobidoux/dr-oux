var CACHE_NAME = "dr-oux-v1";
var urlsToCache = [
    "/favicon.ico",
    "/index.html",
    "/assets/manifest/android-add-to-home.json",
    //"/assets/css/index.css",
    //"/assets/js/app.js",
    "/assets/img/icon-192.png",
    "/assets/img/the-one-sprite.png",
    "/assets/sounds/bg-wii.mp3",
    "/assets/sounds/sfx.mp3"
];
self.addEventListener("install", function(event) {
    
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
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