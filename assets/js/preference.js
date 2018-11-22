(function (global, ns){
    "use strict";
    function preference(key, defaultValue) {
        try {
            var v = localStorage.getItem(key);
            return v === null ? defaultValue : v;
        }
        catch(e) {
            return defaultValue;
        }
    }

    preference.set = function(name, value) {
        try {
            localStorage.setItem(name, value);
        } catch(e) {}
    };

    global[ns] = preference;
})(this, "preference");