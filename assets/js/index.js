"use strict";

// var ws = new WebSocket(window.location.origin.replace(/^http/,"ws") + "/ws");
window.debug = new Debug(document.getElementById("main"));

var inputs = new Inputs().bindKeys();

var game = new DrMario({ root: document.getElementById("main") });
var multiplayer = new Multiplayer(game);

game.registerInputs(inputs);
game.registerForTick(inputs.tick.bind(inputs));
game.registerForTick(debug.tick.bind(debug));
game.registerForTick(multiplayer.tick.bind(multiplayer));

// onscreen controller
//Controller(document.getElementById("main"), inputs);

//menu.init(game, multiplayer, inputs);

(function(){
    function play(){
        document.removeEventListener("click",play);
        document.removeEventListener("keydown",play);

        Sounds.initialize();
        Sounds.play("wii-title");        
    }

    document.addEventListener("click",play);
    document.addEventListener("keydown",play);
})();


// app cache
// Check if a new cache is available on page load.
window.addEventListener("load", function(e) {
    if(!window.applicationCache) {
        menu.set("cache_status","no-cache-ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
        return;
    }

    // Fired after the first cache of the manifest.
    window.applicationCache.addEventListener("cached", function(ev){
        menu.set("cache_status","ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
    }, false);

    // Checking for an update. Always the first event fired in the sequence.
    window.applicationCache.addEventListener("checking", function(ev){
        menu.set("cache_status","looking");
    }, false);

    // An update was found. The browser is fetching resources.
    window.applicationCache.addEventListener("downloading", function(ev) {
        menu.set("cache_status","downloading");
    }, false);

    // The manifest returns 404 or 410, the download failed,
    // or the manifest changed while the download was in progress.
    window.applicationCache.addEventListener("error", function(ev){
        var err = {};
        for(var k in ev)
            err[k] = ev[k];
        menu.set("error", err);
        menu.set("cache_status_error",ev.message);
        menu.set("cache_status","error");
    }, false);

    // Fired after the first download of the manifest.
    window.applicationCache.addEventListener("noupdate", function(ev){
        menu.set("cache_status","ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
    }, false);

    // Fired if the manifest file returns a 404 or 410.
    // This results in the application cache being deleted.
    window.applicationCache.addEventListener("obsolete", function(ev){
        menu.set("cache_status","obselete");
    }, false);

    var loaded = 0;
    // Fired for each resource listed in the manifest as it is being fetched.
    window.applicationCache.addEventListener("progress", function(ev){
        menu.set("cache_status","progress");
        menu.set("cache_status_progress",
            typeof(ev.loaded)==="undefined" ?
            { total: "?", loaded: loaded++} :
            { total: ev.total, loaded: ev.loaded }
        );
    }, false);

    window.applicationCache.addEventListener("updateready", function(e) {
      if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
        // Browser downloaded a new app cache.
        menu.set("cache_status","new-available");
      } else {
        // Manifest didn't changed. Nothing new to server.
        menu.set("cache_status","ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
      }
    }, false);
  
  }, false);
