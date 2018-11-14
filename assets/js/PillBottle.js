(function (global, ns) {
    var BOTTLE_WIDTH = 8;
    var BOTTLE_HEIGHT = 16;
    var SQUARE_LENGTH = 8;

    /**
     * Represent a play area - either controlled by the player or over network
     * @param {DrMario} drMario Instance of the overarching game
     * @param {float}   scale   The size of the content
     */
    function PillBottle(drMario, scale) {
        this._drMario = drMario;
        this._scale = scale || 1;

        this.initUI();
        this._context = this._canvas.getContext("2d");

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
        this._canvas.width = BOTTLE_WIDTH * SQUARE_LENGTH;
        this._canvas.height = BOTTLE_HEIGHT * SQUARE_LENGTH;
        if (this._scale > 1) {
            this._canvas.style.transform = "scale(" + this._scale + ")";
            this._canvas.style.transformOrigin = "top left";
        }
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
        var prevVirusCount = this._virusCount;

        this._virusCount = 0;
        this._board.each(function (code, x, y) {
            Board.renderSprite(this._context, code, x * SQUARE_LENGTH, y * SQUARE_LENGTH, tick);

            if (Board.isVirus(code))
                this._virusCount++;
        }.bind(this));

        if (prevVirusCount != this._virusCount)
            this._status.innerText = "Virus Remaining: " + this._virusCount;
    };

    global[ns] = PillBottle;
})(this, "PillBottle");