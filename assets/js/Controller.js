(function(global, ns){
    function Controller(parentElement, inputs) {
        var root = document.createElement("div");
        root.className = "controller";
        var controls = [
            {keyCode:40, label:"DOWN", className:"controller-arrow"},
            {keyCode:38, label:"UP", className:"controller-arrow"},
            {keyCode:37, label:"LEFT", className:"controller-arrow"},
            {keyCode:39, label:"RIGHT", className:"controller-arrow"},
            {keyCode:88, label:"A", className:"controller-button"},
            {keyCode:90, label:"B", className:"controller-button"},
            {keyCode:19, label:"START", className:"controller-options"},
            {keyCode:27, label:"SELECT", className:"controller-options"},
        ]

        var btns = {};

        for(var i=0; i<controls.length; i++) {
            var btn = document.createElement("button");
            btn.className = "controller-btn controller-"+controls[i].label.toLowerCase();
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
                btns[keyCode].className = btns[keyCode].getAttribute("org-class-name") + " controller-active";

                orgPress.apply(inputs,arguments);
        };

        inputs.release = function(keyCode){
            if(typeof(btns[keyCode]) !== "undefined")
                btns[keyCode].className = btns[keyCode].getAttribute("org-class-name");

            orgRelease.apply(inputs,arguments);
        };
        

        parentElement.appendChild(root);
    }

    global[ns] = Controller;
})(this,"Controller");
