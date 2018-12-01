(function(global, ns){
    function RetroController(parentElement, inputs) {
        var root = document.createElement("div");
        root.className = "retro-controller";
        var controls = [
            {keyCode:40, label:"DOWN", className:"retro-controller-arrow"},
            {keyCode:38, label:"UP", className:"retro-controller-arrow"},
            {keyCode:37, label:"LEFT", className:"retro-controller-arrow"},
            {keyCode:39, label:"RIGHT", className:"retro-controller-arrow"},
            {keyCode:88, label:"A", className:"retro-controller-button"},
            {keyCode:90, label:"B", className:"retro-controller-button"},
            {keyCode:19, label:"START", className:"retro-controller-options"},
            {keyCode:27, label:"SELECT", className:"retro-controller-options"},
        ]

        var btns = {};

        for(var i=0; i<controls.length; i++) {
            var btn = document.createElement("button");
            btn.className = "retro-controller-btn retro-controller-"+controls[i].label.toLowerCase();
            if(controls[i].className)
                btn.className += " " + controls[i].className;

            btn.text = controls[i].label;
            btn.addEventListener("mousedown", inputs.press.bind(inputs, controls[i].keyCode));
            btn.addEventListener("mouseup", inputs.release.bind(inputs, controls[i].keyCode));
            root.appendChild(btn);

            btns[controls[i].keyCode] = btn;
            btn.setAttribute("org-class-name", btn.className);
        }

        // monkey patch input press and release to add visual feedback
        // TODO check for a clearner solution ;)
        var orgPress = inputs.press;
        var orgRelease = inputs.release;

        inputs.press = function(keyCode){
            if(typeof(btns[keyCode]) !== "undefined")
                btns[keyCode].className = btns[keyCode].getAttribute("org-class-name") + " retro-controller-active";

                orgPress.apply(inputs,arguments);
        };

        inputs.release = function(keyCode){
            if(typeof(btns[keyCode]) !== "undefined")
                btns[keyCode].className = btns[keyCode].getAttribute("org-class-name");

            orgRelease.apply(inputs,arguments);
        };
        

        parentElement.appendChild(root);
    }

    global[ns] = RetroController;
})(this,"RetroController");
