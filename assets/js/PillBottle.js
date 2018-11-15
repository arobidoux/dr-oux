(function (global, ns) {
    var BOTTLE_WIDTH = 8;
    var BOTTLE_HEIGHT = 16;
    var SQUARE_LENGTH = 8;

    var PADDING = {
        TOP: SQUARE_LENGTH * 5,
        LEFT: SQUARE_LENGTH * 1,
        RIGHT: SQUARE_LENGTH * 5,
        BOTTOM: SQUARE_LENGTH * 1
    };
    

    var sprite2Form = {
        bottle2: [98,187,178-98,363-187]
    };

    var sprite2 = document.getElementById("sprite2");

    /**
     * Represent a play area - either controlled by the player or over network
     * @param {DrMario} drMario Instance of the overarching game
     * @param {float}   scale   The size of the content
     */
    function PillBottle(drMario, scale) {
        this._drMario = drMario;
        this._scale = scale || 1;

        this.initUI();

        this._board = new Board({
            width: BOTTLE_WIDTH,
            height: BOTTLE_HEIGHT
        });

        this._virusCount = 0;
        this._status.innerText = "Initialized";
    }

    PillBottle.prototype.initUI = function () {
        this._drMario._root.append(
            this._root = document.createElement("div")
        );

        this._root.append(
            this._status = document.createElement("div")
        );

        this._root.append(
            this._canvas = document.createElement("canvas")
        );

        this._root.className = "pill-bottle-root";
        this._status.className = "pill-bottle-status";
        this._canvas.className = "pill-bottle-canvas";
        this._canvas.width = BOTTLE_WIDTH * SQUARE_LENGTH + PADDING.TOP + PADDING.BOTTOM;
        this._canvas.height = BOTTLE_HEIGHT * SQUARE_LENGTH + PADDING.RIGHT + PADDING.LEFT;
        if (this._scale > 1) {
            this._canvas.style.transform = "scale(" + this._scale + ")";
            this._canvas.style.transformOrigin = "top left";
        }

        this._context = this._canvas.getContext("2d");
    };

    PillBottle.prototype.registerInputs = function(inputs) {
        this._board.registerInputs(inputs);
    };

    PillBottle.prototype.generateForDifficulty = function (difficulty) {
        this._board.fillInVirus(difficulty);
    };

    PillBottle.prototype.loadLvl = function (lvl) {
        this._board.fillInVirus(lvl);
    };

    PillBottle.prototype.tick = function (tick) {
        this._board.tick(tick);
    };

    PillBottle.prototype.render = function (tick) {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        
        // draw bottle
        this._context.drawImage(
            sprite2,
            sprite2Form.bottle2[0],
            sprite2Form.bottle2[1],
            sprite2Form.bottle2[2],
            sprite2Form.bottle2[3],
            0, 0, this._canvas.width - PADDING.RIGHT+PADDING.LEFT+1, this._canvas.height+1);

        var prevVirusCount = this._virusCount;

        this._virusCount = 0;
        this._board.each(function (code, x, y) {
            Board.renderSprite(this._context, code, x * SQUARE_LENGTH + PADDING.LEFT, y * SQUARE_LENGTH + PADDING.TOP, tick);

            if (Board.isVirus(code))
                this._virusCount++;
        }.bind(this));

        // move this to not use private attribute
        Board.renderSprite(this._context, this._board._nextPill.a, SQUARE_LENGTH*(BOTTLE_WIDTH+2) ,SQUARE_LENGTH*2 , tick);
        Board.renderSprite(this._context, this._board._nextPill.b, SQUARE_LENGTH*(BOTTLE_WIDTH+3) ,SQUARE_LENGTH*2, tick);

        if (prevVirusCount != this._virusCount)
            this._status.innerText = "Virus" + (this._virusCount>1?"es":"") + " Remaining: " + this._virusCount;
        
        return this._virusCount;
    };

    global[ns] = PillBottle;
})(this, "PillBottle");