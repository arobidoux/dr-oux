(function(){

    function sendToSW(msg) {
        if(navigator.serviceWorker.controller === null) {
            // delay it
            var ctx = typeof(this.tries) === "undefined" ? { tries: 0 } : this;
            if(++ctx.tries >= 10) {
                console.error("aborting sending message to service worker:" + msg);
                return;
            }

            setTimeout(sendToSW.bind(ctx,msg),500);
        }
        else {
            navigator.serviceWorker.controller.postMessage(msg);
        }
    }

    if("serviceWorker" in navigator && typeof(serviceWorkerUrl) !== "undefined" && serviceWorkerUrl) {
        window.addEventListener("load", function() {
            navigator.serviceWorker.register(serviceWorkerUrl)
            .then(function(registration) {
                return navigator.serviceWorker.ready
            }).then(function(){
                sendToSW({event:"getversion"});
                
                // Registration was successful
                menu.set("cache_status","ready");
                setTimeout(function(){
                    menu.set("cache_status","");
                },1000);
            }, function(err) {
                // registration failed :(
                menu.set("cache_status","error");
                menu.set("cache_status_error",err);
            });
        });

        navigator.serviceWorker.addEventListener("message", function(ev){
            if(typeof(ev.data) == "object" && typeof(ev.data.event) !== "undefined") {
                switch(ev.data.event) {
                    case "version":
                        menu.set("app_version", ev.data.data.version);
                        break;

                    case "updating":
                        menu.set("cache_status","updating");
                        break;
                    case "update_progress":
                        menu.set("cache_status","progress");
                        menu.set("cache_status_progress",{
                            total: ev.data.data.total,
                            loaded: ev.data.data.total.done
                        });
                        break;
                    case "updated":
                        window.location.reload();
                        break;
                }
            }
        });
        
    }
})();