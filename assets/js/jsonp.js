(function (global, ns){
    "use strict";
    
    var body = document.getElementsByTagName("body")[0];
    var next_callback_id = 1;
    var callback_salt = "__jsonp_generated_callback_";

    function jsonp(url, timeout, replacestr) {
        return new Promise(function(resolve, reject) {
            // generate context
            var ctx = {
                script: document.createElement("script"),
                callbackname: callback_salt + (next_callback_id++),
                timeoutId: null,
                reject: reject,
                resolve: resolve
            };
            
            // schedule error timeout (if defined)
            if(typeof(timeout) !== "undefined")
                ctx.timeoutId = setTimeout(failure.bind(ctx), timeout*1000);

            // register success callback
            window[ctx.callbackname] = success.bind(ctx);
            
            // add registered callback name to the url
            if(typeof(replacestr) !== "undefined")
                url.replace(replacestr, ctx.callbackname);
            else
                url += ctx.callbackname;

            // append to body
            body.appendChild(ctx.script);

            // load the url
            ctx.script.src = url;
        });
    }

    // success callback, this should be the `ctx` defined from jsonp
    function success(data) {
        if(this.timeoutId)
            clearTimeout(this.timeoutId);

        if(this.script.parentElement)
            this.script.parentElement.removeChild(this.script);
        this.resolve(data);
    }

    // failure callback, this should be the `ctx` defined from jsonp
    function failure() {
        if(this.script.parentElement)
            this.script.parentElement.removeChild(this.script);

        this.timeoutId = null;
        this.reject();
    }

    global[ns] = jsonp;
})(this, "jsonp");