(function(){

    function sendToSW(data) {
        navigator.serviceWorker.controller.postMessage(data);
    }

    if("serviceWorker" in navigator) {
        window.addEventListener("load", function() {
            navigator.serviceWorker.register(serviceWorkerUrl)
            .then(function(registration) {
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