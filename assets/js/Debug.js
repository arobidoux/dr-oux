(function(global, ns){
    function Debug(root) {
        root.appendChild(this._element = document.createElement("pre"));

        this._values = {};
    }

    Debug.prototype.set = function(key, value) {
        this._values[key] = value;
        return this;
    };

    Debug.prototype.tick = function() {
        var s = this._serialize();
        if(s != this._element.innerText)
            this._element.innerText = s;
    };

    Debug.prototype._serialize = function() {
        var s = "";
        var line = ".".repeat(16);

        for(var k in this._values)
            s += (k+line).substr(0,16) + ":" + this._values[k] + "\n";
        
        return s;
    };

    global[ns] = Debug;
})(this,"Debug");