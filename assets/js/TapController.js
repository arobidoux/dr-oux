(function(global, ns){
    function TapController(parentElement, inputs, swaps) {
        var root = this._root = document.createElement("div");
        root.className = "tap-controller";
        root.addEventListener("touchstart", this._touchStart.bind(this));
        root.addEventListener("touchend", this._touchEnd.bind(this));

        this.swapZones(swaps);

        this._touches = {};
        this._inputs = inputs;

        document.getElementById("main").style.bottom = (Math.floor(window.innerHeight*.25)-20)+"px";

        parentElement.appendChild(root);
        this._root.addEventListener("mousedown", function(e){ e.preventDefault(); }, false);
    }

    /**
     * Reset Zones and swap those provided
     */
    TapController.prototype.swapZones = function(swaps) {
        var zones = TapController.defaultZones();
        this._zones = [];
        for(var fromLabel in swaps) {
            var from=-1, to=-1;
            for(var i=0;i<zones.length && (from == -1 || to == -1) ;i++) {
                switch(zones[i].label) {
                    case fromLabel: from=i; break;
                    case swaps[fromLabel]: to=i; break;
                }
            }

            if(from==-1 || to==-1) {
                console.error("Invalid Swap " + fromLabel + " <-> " + swaps[fromLabel]);
                continue;
            }

            //{keyCode:40, label:"DOWN",  zone:[  0, h75, w50,   h]},

            

            this._zones.push({
                keyCode:zones[from].keyCode,
                label:zones[from].label,
                zone:zones[to].zone
            });

            zones[to].handled = true;
        }

        for(var i=0;i<zones.length;i++)
            if(typeof(zones[i].handled) === "undefined" || !zones[i].handled)
                this._zones.push(zones[i]);

        // redraw if already on screen
        if(this._root.lastElementChild)
            this.display();
        
        return this;
    };

    TapController.prototype.display = function() {
        while(this._root.lastElementChild)
            this._root.removeChild(this._root.lastElementChild);


        for(var i=0;i<this._zones.length;i++) {
            var elem = document.createElement("div");
            elem.className = "zone";
            elem.style.left = this._zones[i].zone[0] + "px";
            elem.style.top = this._zones[i].zone[1] + "px";
            elem.style.width = elem.style.lineHeight = (this._zones[i].zone[2] - this._zones[i].zone[0] -1) + "px";
            elem.style.height = elem.style.lineHeight = (this._zones[i].zone[3] - this._zones[i].zone[1] -1) + "px";
            elem.style.textAlign = "center";
            elem.textContent = this._zones[i].label;

            this._root.appendChild(elem);
        }

        this._root.className += " shown";
    };

    TapController.prototype.destroy = function() {
        if(this._root) {
            if(this._root.parentElement)
                this._root.parentElement.removeChild(this._root);
            this._root = null;

            document.getElementById("main").style.removeProperty("bottom");
        }
    };

    TapController.prototype._touchStart = function(ev) {        
        if(!this._inputs)
            return;

        console.log("[TOUCH] start");

        for(var i=0; i<ev.changedTouches.length;i++) {
            if(typeof(this._touches[ev.changedTouches[i].identifier]) === "undefined") {
                for(var j=0;j<this._zones.length; j++ ) {
                    if(
                        ev.changedTouches[i].clientX >= this._zones[j].zone[0] &&
                        ev.changedTouches[i].clientX < this._zones[j].zone[2] &&
                        ev.changedTouches[i].clientY >= this._zones[j].zone[1] &&
                        ev.changedTouches[i].clientY < this._zones[j].zone[3]
                    ) {
                        this._touches[ev.changedTouches[i].identifier] = this._zones[j].keyCode;
                        console.log("[TAP] pressing "+this._zones[j].keyCode);
                        this._inputs.press(this._zones[j].keyCode);
                        break;
                    }
                }
            }
        }

        ev.preventDefault();
    };

    TapController.prototype._touchEnd = function(ev) {
        if(!this._inputs)
            return;

        console.log("[TOUCH] end");

        for(var i=0; i<ev.changedTouches.length;i++) {
            if(typeof(this._touches[ev.changedTouches[i].identifier]) !== "undefined") {
                this._inputs.release(this._touches[ev.changedTouches[i].identifier]);
                console.log("[TAP] releasing "+this._touches[ev.changedTouches[i].identifier]);
                delete this._touches[ev.changedTouches[i].identifier];
            }
        }

        ev.preventDefault();
    };

    TapController.defaultZones = function() {
        /*
        ---------------------------
        |          ESC            |
        ---------------------------
        |         PAUSE           |
        |-------------------------|
        |      |    A     |       |
        | LEFT |----------| RIGHT |
        |      |    B     |       |
        |-------------------------|
        |    DOWN   |     SINK    |
        ---------------------------
        */
        
       var h = window.innerHeight;
       var w = window.innerWidth;

       var h05 = Math.floor(h * .05);
       var h25 = Math.floor(h * .25);
       var h50 = Math.floor(h * .5);
       var h75 = Math.floor(h * .75);
       var w25 = Math.floor(w * .25);
       var w50 = Math.floor(w * .5);
       var w75 = Math.floor(w * .75);

       return [
           {keyCode:40, label:"DOWN",  zone:[  0, h75, w50,   h]},
           {keyCode:38, label:"SINK",  zone:[w50, h75,   w,   h]},
           {keyCode:37, label:"LEFT",  zone:[  0, h25, w25, h75]},
           {keyCode:39, label:"RIGHT", zone:[w75, h25,   w, h75]},
           {keyCode:88, label:"A",     zone:[w25, h25, w75, h50]},
           {keyCode:90, label:"B",     zone:[w25, h50, w75, h75]},
           {keyCode:19, label:"PAUSE", zone:[  0, h05,   w, h25]},
           {keyCode:27, label:"ESC",   zone:[  0,   0,   w, h05]}
       ];
    };
        
    global[ns] = TapController;
})(this,"TapController");
