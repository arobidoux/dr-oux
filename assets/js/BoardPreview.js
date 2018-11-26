(function (global, ns){
    "use strict";

    var BOTTLE_WIDTH = 8;
    var BOTTLE_HEIGHT = 16;

    function BoardPreview() {
        this._board = new Board({
            width: BOTTLE_WIDTH,
            height: BOTTLE_HEIGHT
        });

        this._canvas = document.createElement("canvas");
    }

    BoardPreview.prototype.render = function() {
        var ctx = this._canvas.getContext("2d");
        this._board.each(function (code, x, y) {
            if(!code)
                return;

            var color = [0,0,0];
            switch(code & Board.CODES.colors.mask) {
                case Board.CODES.colors.values.red.code: color[0] = 255; break;
                case Board.CODES.colors.values.yellow.code: color[0] = 255; color[1] = 255; break;
                case Board.CODES.colors.values.blue.code: color[2] = 255; break;
            }
            if(code & Board.CODES.forms.mask == Board.CODES.forms.values.virus.code)
                for(var i=0;i<colors.length;i++)
                    if(colors[i])
                        colors[i] = Math.floor(colors[i] * .6);

            var c = "#"
            for(var i=0;i<colors.length;i++)
                c += ("00".colors[i].toString(2)).slice(-2);

            ctx.fillStyle = c;
            ctx.fillRect(x,y,1,1);
        }.bind(this));
    };

    global[ns] = BoardPreview;
})(this, "BoardPreview");
