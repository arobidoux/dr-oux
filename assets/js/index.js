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


    // Fired after the first cache of the manifest.
    window.applicationCache.addEventListener("cached", function(ev){
        game.setStatus("Application cached!");
    }, false);

    // Checking for an update. Always the first event fired in the sequence.
    window.applicationCache.addEventListener("checking", function(ev){
        game.setStatus("Looking for new version...");
    }, false);

    // An update was found. The browser is fetching resources.
    window.applicationCache.addEventListener("downloading", function(ev) {
        game.setStatus("Downloading new Version...");
    }, false);

    // The manifest returns 404 or 410, the download failed,
    // or the manifest changed while the download was in progress.
    window.applicationCache.addEventListener("error", function(ev){
        game.setStatus("Error while downloading new version");
    }, false);

    // Fired after the first download of the manifest.
    window.applicationCache.addEventListener("noupdate", function(ev){
        game.setStatus("");
    }, false);

    // Fired if the manifest file returns a 404 or 410.
    // This results in the application cache being deleted.
    window.applicationCache.addEventListener("obsolete", function(ev){
        game.setStatus("Application version obsolete");
    }, false);

    // Fired for each resource listed in the manifest as it is being fetched.
    window.applicationCache.addEventListener("progress", function(ev){
        game.setStatus("Progress " + ev.loaded + "/" + ev.total);
    }, false);

    window.applicationCache.addEventListener("updateready", function(e) {
      if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
        // Browser downloaded a new app cache.
        game.setStatusHtml("A new fresher version of the game is available and ready to go! click "+'<button onclick="window.location.reload();">here</button>' + " to use it!");
      } else {
        // Manifest didn't changed. Nothing new to server.
        game.setStatus("");
      }
    }, false);
  
  }, false);