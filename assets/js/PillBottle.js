(function (global, ns) {
    var BOTTLE_WIDTH = 8;
    var BOTTLE_HEIGHT = 16;
    var SQUARE_LENGTH = 8;

    var RECORD_REFERENCE_FRAME_EVERY = 512;

    var PADDING = {
        TOP: SQUARE_LENGTH * 5,
        LEFT: SQUARE_LENGTH * 1,
        RIGHT: SQUARE_LENGTH * 5,
        BOTTOM: SQUARE_LENGTH * 1
    };

    var NEXT_PILL_X = SQUARE_LENGTH * (BOTTLE_WIDTH + 2);
    var NEXT_PILL_Y = SQUARE_LENGTH * 2;

    var NEW_PILL_X = (BOTTLE_WIDTH + PADDING.LEFT + PADDING.RIGHT / 2) - 1;
    var NEW_PILL_Y = PADDING.TOP;

    var sprite2Form = {
        bottle2: [98, 187, 178 - 98, 363 - 187]
    };

    var sprite2 = document.getElementById("sprite2");

    /**
     * Represent a play area - either controlled by the player or over network
     * @param {object}  options       Initialization params
     * @param {float}   options.scale The size of the content
     * @param {DOMELEM} options.root  where to append our html
     */
    function PillBottle(options) {
        this._scale = options && options.scale || 1;

        this.initUI(options && options.root || document.getElementsByTagName("body")[0], options && options.title || null);

        this._board = new Board({
            width: BOTTLE_WIDTH,
            height: BOTTLE_HEIGHT
        });

        this._recording = false;
        this._stream_to = [];
    }

    PillBottle.prototype.destroy = function() {
        if(this._root.parentElement)
            this._root.parentElement.removeChild(this._root);
    };

    PillBottle.prototype.record = function () {
        this._recording = true;
    };

    PillBottle.prototype.stopRecording = function () {
        this._recording = false;
        return this._board._film;
    };

    PillBottle.prototype.initUI = function (root, title) {
        root.appendChild(
            this._root = document.createElement("div")
        );

        if(title) {
            var titleElem=document.createElement("h3");
            titleElem.textContent = title;
            this._root.appendChild(titleElem);
        }

        this._root.appendChild(
            this._status = document.createElement("div")
        );

        this._root.appendChild(
            this._canvas = document.createElement("canvas")
        );

        this._root.appendChild(
            this._msg = document.createElement("div")
        );

        this._root.className = "pill-bottle-root";
        this._status.className = "pill-bottle-status";
        this._canvas.className = "pill-bottle-canvas";
        this._msg.className = "pill-bottle-msg";

        this._canvas.width = BOTTLE_WIDTH * SQUARE_LENGTH + PADDING.TOP + PADDING.BOTTOM;
        this._canvas.height = BOTTLE_HEIGHT * SQUARE_LENGTH + PADDING.RIGHT + PADDING.LEFT;
        if (this._scale > 1) {
            this._root.style.transform = "scale(" + this._scale + ")";
            this._root.style.transformOrigin = "top left";
        }

        this._context = this._canvas.getContext("2d");
        this.setMessage(null);
    };

    PillBottle.prototype.setMessage = function(msg) {
        if(msg) {
            this._msg.textContent = msg;
            this._msg.style.display = "block";
        }
        else {
            this._msg.textContent = "";
            this._msg.style.display = "none";
        }
    };

    PillBottle.prototype.setStatus = function(status) {
        if(status) {
            this.status.textContent = status;
            //this.status.style.display = "block";
        }
        else {
            this.status.textContent = "";
            //this.status.style.display = "none";
        }
    };

    PillBottle.prototype.registerInputs = function (inputs) {
        this._board.registerInputs(inputs);
    };

    PillBottle.prototype.generateForDifficulty = function (difficulty) {
        this._board.fillInVirus(difficulty);
    };

    PillBottle.prototype.loadLvl = function (lvl) {
        this._board.fillInVirus(lvl);
    };

    PillBottle.prototype.streamTo = function (handle) {
        this._stream_to.push(handle);
    };

    PillBottle.prototype.stopStreaming = function (handle) {
        for (var i = 0; i < this._stream_to.length; i++)
            if (this._stream_to[i] === handle)
                this._stream_to.splice(i--, 1);

    };

    PillBottle.prototype.generateStreamHandler = function () {
        var tick = 0;
        return function (frame) {
            tick++;
            var updated = this._board.playFrame(frame);
            if (updated) {
                this.render(tick);
                // look at virus count
                this.updateVirusCount(this._board.getVirusCount());
            }
        }.bind(this);
    };

    PillBottle.prototype.updateVirusCount = function(count) {
        this._status.textContent =
            "Virus" + (count>1?"es":"") +
            " Remaining: " + count;
    };

    PillBottle.prototype.tick = function (tick) {
        var tickStats = this._board.tick(tick);

        // TODO look to offload this to a new worker
        if (this._recording) {
            var frame = this._board.getNewFrame(tick / RECORD_REFERENCE_FRAME_EVERY == 0);
            for (var i = 0; i < this._stream_to.length; i++) {
                this._stream_to[i](frame);
            }
        }

        if (!this._last_virus_count || this._last_virus_count != tickStats.virus)
            this.updateVirusCount(tickStats.virus);

        this._last_virus_count = tickStats.virus;

        return tickStats;
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
            0, 0, this._canvas.width - PADDING.RIGHT + PADDING.LEFT + 1, this._canvas.height + 1);

        this._board.each(function (code, x, y) {
            Board.renderSprite(this._context, code, x * SQUARE_LENGTH + PADDING.LEFT, y * SQUARE_LENGTH + PADDING.TOP, tick);
        }.bind(this));

        // TODO move this to not use private attribute
        // make required transformation to draw the next pill
        if (this._board._nextPill) {

            this._context.save();
            if (this._board._generateNextOwnPillOn == 0) {
                this._context.translate(NEXT_PILL_X, NEXT_PILL_Y);
            }
            else {
                var time = this._board._effective_speed - (this._board._generateNextOwnPillOn - tick);
                this._context.translate(
                    this.getNextPillX(NEXT_PILL_X, NEW_PILL_X, time, this._board._effective_speed),
                    this.getNextPillY(NEXT_PILL_Y, NEW_PILL_Y, time, this._board._effective_speed)
                );
                this._context.rotate(-time);
            }

            // Draw the next pill
            Board.renderSprite(this._context, this._board._nextPill.a, 0, 0, tick);
            Board.renderSprite(this._context, this._board._nextPill.b, SQUARE_LENGTH, 0, tick);

            this._context.restore();
        }
    };

    PillBottle.prototype.getNextPillX = function (sx, dx, time, delay) {
        if (time > delay - 2)
            return dx;

        return sx - ((sx - dx) / (delay - 2) * time);
    };

    PillBottle.prototype.getNextPillY = function (sy, dy, time, delay) {
        // todo put in a formula instead of those hardcoded values?
        switch (time) {
            case 0: return 12;
            case 1: return 8;
            case 2: return 8;
            case 3: return 8;
            case 4: return 8;
            case 5: return 8;
            case 6: return 24;
            case 7: return 40;
            default: return dy;
        }
    };

    global[ns] = PillBottle;
})(this, "PillBottle");
