(function (global, ns) {
    const SPEED_FACTOR = 16;
    const ANIMATION_TICK_MULTIPLIER = .25;
    const SUITE_MIN_LENGTH = 3;
    const BOARD_TICK_SPEED = 1 / ANIMATION_TICK_MULTIPLIER;
    /**
     * Represent a play board in memory
     * Handle piece movement, sprite rendering, etc
     * 
     * @param {int} width  how many square wide is the bottle
     * @param {int} height how many square high is the bottle
     */
    function Board(options) {
        this._width = options.width || 8;
        this._height = options.height || 16;
        this._speed = options.speed || Board.SPEED.NORMAL;

        this._effective_speed = (1 / this._speed) * SPEED_FACTOR;
        this._size = this._height * this._width;
        this._previousFrame = null;
        this._film = [];
        this._filmWeight = 0;

        /** Full representation of the board on 1 string
         * Rows are represented from top to bottom, left to right
         * horizontal value are consecutive, vertical values are
         * offseted by this._width
         */
        if (typeof (Uint8Array) !== "undefined")
            this._data = new Uint8Array(this._size).fill(0);
        else
            this._data = new Array(this._size).fill(0);

        this._ownedPill = null;
        this._nextPill = null;
        this._generateNextOwnPillOn = 0;
        this._handicaps = [];
        this._stats = {
            virus: 0,
            explosions: 0,
            counting_combos: [],
            combos: [],
            gameOver: false
        };
    }

    Board.SPEED = {
        SLOW: 1,
        NORMAL: 2,
        FAST: 4,
    };

    Board.prototype.registerInputs = function (input) {
        this.queueNextPill();

        inputs.register("RIGHT", this.action.bind(this, "right"), 1 / ANIMATION_TICK_MULTIPLIER);
        inputs.register("LEFT", this.action.bind(this, "left"), 1 / ANIMATION_TICK_MULTIPLIER);
        inputs.register("DOWN", this.action.bind(this, "down"), 1 / (2 * ANIMATION_TICK_MULTIPLIER));
        inputs.register("UP", this.action.bind(this, "sink"), 1 / ANIMATION_TICK_MULTIPLIER);
        inputs.register("ROTATE_CLOCKWISE", this.action.bind(this, "rotate"));
        inputs.register("ROTATE_COUNTER_CLOCKWISE", this.action.bind(this, "rotateC"));
    };

    Board.prototype.destroyCell = function (x, y) {
        var p = this.coordToPos(x, y);
        var f = this._data[p] & Board.CODES.forms.mask;

        // update double pill
        var delta = 0;
        switch (f) {
            case Board.CODES.forms.values.up.code: delta = -1 * this._width; break;
            case Board.CODES.forms.values.down.code: delta = this._width; break;
            case Board.CODES.forms.values.left.code: delta = -1; break;
            case Board.CODES.forms.values.right.code: delta = 1; break;
        }
        if (delta) {
            var p2 = p + delta;
            if (p2 > 0 && p2 < this._size) {
                this._data[p2] = this._data[p2] & Board.CODES.colors.mask;
            }
        }

        this._data[p] = Board.CODES.forms.values.exploding.code | (this._data[p] & Board.CODES.colors.mask);
    }

    Board.prototype._checkPillDestruction = function (x, y) {
        var l = this.getColorLength(x, y);

        var destroyed = 0;

        if (l.u + l.d >= SUITE_MIN_LENGTH) {
            for (var i = 0; i <= l.u; i++)
                this.destroyCell(x, y - i);
            for (var i = 1; i <= l.d; i++)
                this.destroyCell(x, y + i);
            destroyed++;
        }

        if (l.l + l.r >= SUITE_MIN_LENGTH) {
            for (var i = 0; i <= l.l; i++)
                this.destroyCell(x - i, y);
            for (var i = 1; i <= l.r; i++)
                this.destroyCell(x + i, y);
            destroyed++;
        }
        return destroyed;
    };

    Board.prototype.tickBoard = function (tick) {
        if (tick % BOARD_TICK_SPEED)
            return true;

        var changed = [];
        // start 1 row to last (last row will not move anymore)
        for (var i = this._size - this._width; i >= 0; i--) {
            if (this._data[i] == 0x00)
                continue;

            switch (this._data[i] & Board.CODES.forms.mask) {
                // if the pill is left
                case Board.CODES.forms.values.left.code:
                    // check if it can move this one and the other half down
                    var t = i + this._width;
                    var t2 = t - 1;
                    var i2 = i - 1;
                    if (this._data[t] == 0x00 && this._data[t2] == 0x00) {
                        this._data[t] = this._data[i];
                        this._data[t2] = this._data[i2];
                        this._data[i] = 0x00;
                        this._data[i2] = 0x00;
                        changed.push(i);
                        changed.push(i2);
                    }
                    break;

                // if the pill is up or alone
                case Board.CODES.forms.values.up.code:
                    // check if it can move down
                    var t = i + this._width;
                    if (this._data[t] == 0x00) {
                        var p = i - this._width;
                        this._data[t] = this._data[i];
                        // TODO handle top alone pill?
                        this._data[i] = this._data[p];
                        this._data[p] = 0x00;
                        changed.push(t);
                        changed.push(i);
                    }
                    break;

                case Board.CODES.forms.values.single.code:
                    // check if it can move down
                    var t = i + this._width;
                    if (this._data[t] == 0x00) {
                        this._data[t] = this._data[i];
                        this._data[i] = 0x00;
                        changed.push(t);
                    }
                    break;
            }
        }

        /*
        for (var i = 0; i < changed.length; i++) {
            var c = this.posToCoord(changed[i]);
            this._checkPillDestruction(c.x, c.y);
        }
        */

        if(changed.length) {
            Sounds.play("fall");
        }

        return changed.length > 0;
    };

    Board.prototype.tick = function (tick) {
        // reset some stats
        this._stats.combos = [];
        this._stats.explosions = 0;
        this._stats.virus = 0;

        // cleanup completed explosion
        this.each_raw(function (code, i) {
            switch(code & Board.CODES.forms.mask) {
                case Board.CODES.forms.values.virus.code:
                    this._stats.virus++;
                    break;
            
                case Board.CODES.forms.values.exploding.code:
                    this._data[i] = (code & (0xFF ^ Board.CODES.forms.mask)) | Board.CODES.forms.values.exploded.code;
                    break;

                case Board.CODES.forms.values.exploded.code:
                    this._data[i] = 0x00;
            }
        }.bind(this));

        if (this._ownedPill) {
            if (this._ownedPill.tick(tick) == Pill.TICK.STUCK) {

                this._ownedPill._move({
                    a: (this._ownedPill.a & (0xff ^ Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
                    b: (this._ownedPill.b & (0xff ^ Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
                });

                this._ownedPill = null;
            }
        }

        // if no current main pill is in effect, tick the rest
        else {
            if (this._generateNextOwnPillOn > 0) {
                if (this._generateNextOwnPillOn <= tick) {
                    this._generateNextOwnPillOn = 0;
                    // insert a new pill
                    if(!this.insertNextPill())
                        this._stats.gameOver = true;
                }
                if(this._stats.counting_combos.length) {
                    console.debug("Assigning Combos");
                    if(this._stats.counting_combos.length>1) {
                        Sounds.play("combo1");
                    }

                    this._stats.combos = this._stats.counting_combos;
                    this._stats.counting_combos = [];
                }
            }
            else if (!this.tickBoard(tick)) {
                // reset virus count
                this._stats.virus = 0;

                // see if we need to destroy some pills!
                // gather stats about the current state of the game
                for (var i = this._size - 1; i >= 0; i--) {
                    // skip empty cell
                    if(this._data[i] == 0x00)
                        continue;

                    var c = this.posToCoord(i);

                    var currentForm = this._data[i] & Board.CODES.forms.mask;

                    if(
                        currentForm == Board.CODES.forms.values.exploding.code
                        || currentForm == Board.CODES.forms.values.exploded.code
                    )
                        continue;
                    

                    var explosionCount = this._checkPillDestruction(c.x, c.y);
                    if(explosionCount) {
                        console.debug("Pushing Combos");
                        Sounds.play("destroy");
                        this._stats.counting_combos.push(this._data[i] & Board.CODES.colors.mask);
                    }
                    this._stats.explosions += explosionCount;

                    switch(this._data[i] & Board.CODES.forms.mask) {
                        case Board.CODES.forms.values.virus.code:
                            this._stats.virus++;
                            break;
                    }
                }

                if (!this._stats.explosions) {
                    // look if we need to add the penalitity / handicap
                    if(this._processExternalHandicap()) {   
                        // queue next one
                        this._generateNextOwnPillOn = tick + this._effective_speed;
                        //window.debug.set("Generate Next Pill",this._generateNextOwnPillOn);
                    }
                }
            }
        }

        return this._stats;
    };

    /**
     * Queue pellet to be dropped on the board after the cuirrent pill touches the ground
     */
    Board.prototype.queueHandicap = function(...codes) {
        for(var i=0;i<codes.length && this._handicaps.length < 4; i++) {
            this._handicaps.push(codes[i] & Board.CODES.colors.mask);
        }
        Sounds.play("combo2");
    };

    Board.prototype._processExternalHandicap = function() {
        var l=this._handicaps.length
        if(l) {
            var step = this._width/l;
            for(var i=0; i<l; i++) {
                var x = Math.floor(Math.random()*step) + i*step;
                this._data[x] = this._handicaps[i];
            }

            // clear handicaps, they were processed
            this._handicaps = [];

            // handicap were processed, preventing next pill deployment
            return false;
        }

        // done processing handicaps, allowing next pill to be dropped
        return true;
    };

    Board.prototype.action = function (method) {
        if (!this._ownedPill) {
            console.warn("Action " + method + " occured but no _ownPill yet");
            return;
        }

        this._ownedPill[method]();
        if (method == "sink")
            this._ownedPill = null;
    };

    Board.prototype.queueNextPill = function () {
        this._nextPill = new Pill(
            this,
            this._effective_speed,
            Math.floor(Math.random() * Board.CODES.colors.mask) + 1 | Board.CODES.forms.values.right.code | Board.CODES.states.values.alive.code,
            Math.floor(Math.random() * Board.CODES.colors.mask) + 1 | Board.CODES.forms.values.left.code | Board.CODES.states.values.alive.code
        );
    };

    Board.prototype.insertNextPill = function () {
        var x = (this._width / 2) - 1;
        var y = 0;

        if (this.isEmptySpace(x, y) && this.isEmptySpace(x + 1, y)) {
            this._ownedPill = this._nextPill;
            this._ownedPill._move({ x: x, y: y });
            this.queueNextPill();
            return true;
        }
        else {
            return false
        }
    };

    Board.prototype.isValidCoord = function (x, y) {
        if (
            x < 0
            || x >= this._width
            || y < 0
            || y > this._height
        )
            return false;
        return true;
    };

    Board.prototype.isEmptySpace = function (x, y) {
        // out of bound
        if (!this.isValidCoord(x, y))
            return false;

        return this._data[this.coordToPos(x, y)] == 0x00;
    };

    /** Go over each slot of internal grid, and call the handle
     * function on every value that is not an empty cell.
     * Will also pass along the coordinate of that cell
     */
    Board.prototype.each = function (handle) {
        this.each_raw(function (code, i) {
            var pos = this.posToCoord(i);
            handle(code, pos.x, pos.y);
        }.bind(this));
    };

    Board.prototype.each_raw = function (handle) {
        for (var i = 0; i < this._size; i++) {
            if (this._data[i] !== 0x00) {
                handle(this._data[i], i);
            }
        }
    };

    /** Helper function to inspect the grid */
    Board.prototype.posToCoord = function (pos) {
        var y = Math.floor(pos / this._width);
        var x = pos - y * this._width;
        return { x: x, y: y };
    };

    Board.prototype.coordToPos = function (x, y) {
        return typeof (x) === "object" ? (x.y * this._width + x.x) : (y * this._width + x);
    };

    Board.prototype.getColorOf = function (x, y) {
        return this.isValidCoord(x, y) ? this._data[this.coordToPos(x, y)] & Board.CODES.colors.mask : null;
    };

    /** return the position offset for the cell facing the code describe here */
    Board.posOffset = function (code) {
        var f = code & Board.CODES.forms.mask;
        var o = { x: 0, y: 0 };
        switch (f) {
            case Board.CODES.forms.values.up: o.y--; break;
            case Board.CODES.forms.values.right: o.x++; break;
            case Board.CODES.forms.values.down: o.y--; break;
            case Board.CODES.forms.values.left: o.x--; break;
        }

        return o;
    };

    /** Returns how many cell are the same color as the targeted one,
     * in each direction, not counting the current
     */
    Board.prototype.getColorLength = function (x, y) {
        var c = this.getColorOf(x, y);
        var r = { u: 0, d: 0, l: 0, r: 0 };

        if (c) {
            for (var i = x + 1; i < this._width && this.getColorOf(i, y) == c; i++) r.r++;
            for (var i = x - 1; i >= 0 && this.getColorOf(i, y) == c; i--) r.l++;
            for (var i = y + 1; i < this._height && this.getColorOf(x, i) == c; i++) r.d++;
            for (var i = y - 1; i >= 0 && this.getColorOf(x, i) == c; i--) r.u++;
        }

        return r;
    };

    /** Generator functions */

    /** Randomly place a certain amount of viruses,
     * based on a difficulty level. Will prevent more
     * than 2 of the same color side by side
     */
    Board.prototype.generatorFromDifficulty = function (difficulty) {
        var virusCount = difficulty * 4;

        var density = virusCount / (this._height * this._width);
        if (density > .75) {
            throw new Error("Invalid difficulty, to high");
        }

        // calculate how much space to leave empty at the top of the bottle
        var reservedEmpty = Math.floor((1 - density) / 2 * this._height);
        var randColorStart = Math.floor(Math.random() * Board.CODES.colors.mask);
        return function (generatedCount) {
            if (virusCount <= generatedCount) {
                return null;
            }

            var j;

            while (true) {
                var j = reservedEmpty * this._width;
                var pos = Math.floor(Math.random() * ((this._width * this._height) - generatedCount - j));
                var orgPos = pos;

                // go over the board, skip the position already alocated
                for (; j < this._size && pos > 0; j++) {
                    if (this._data[j] == 0x00) {
                        pos--;
                    }
                };

                // skip the last remaining viruses, if any
                while (j < this._size && this._data[j] != 0x00) {
                    j++;
                }

                this._data[j] = (((generatedCount + randColorStart) % Board.CODES.colors.mask) + 1) | Board.CODES.forms.values.virus.code;

                // validate color length. if length is more than 1, skip this iteration
                var c = this.posToCoord(j);
                var l = this.getColorLength(c.x, c.y);
                if (l.u + l.d > 1 || l.r + l.l > 1) {
                    this._data[j] = 0x00;
                    continue;
                }

                break;
            }

            return [
                j,
                this._data[j],
                orgPos
            ];
        }.bind(this);
    }

    /** Rebuild a level from a stored version */
    Board.prototype.generatorFromHistory = function (compressed_history) {
        var history = atob(compressed_history);
        var idx = 0;
        var len = history.length;
        return function (i, j) {
            if (idx >= len)
                return null;

            return [
                history.charCodeAt(idx++),
                history.charCodeAt(idx++),
                history.charCodeAt(idx++)
            ];
        }
    }

    /** Add virus to the board, spreading them around randomly */
    Board.prototype.fillInVirus = function (generator) {
        switch (typeof (generator)) {
            case "number":
                generator = this.generatorFromDifficulty(generator);
                break;
            case "string":
                generator = this.generatorFromHistory(generator);
                break;
        }

        // clear old game
        this._data.fill(0);
        this._lvl_history = [];

        for (var i = 0, x = generator(i); x !== null; x = generator(++i)) {
            // assign code to desired position
            this._data[x[0]] = x[1];

            var c = this.posToCoord(x[0]);
            var l = this.getColorLength(c.x, c.y);


            var row = String.fromCharCode(x[0]) + String.fromCharCode(x[1]) + String.fromCharCode(x[2]);
            if (row.length > 3) {
                console.error("We have a problem");
                debugger;
            }
            this._lvl_history.push(row);
        }

        console.log("lvl id: " + this.getLvl());
    };

    Board.prototype.fill = function (x, y, c) {
        if (typeof (c) === "undefined")
            c = 0x00;
        this._data[this.coordToPos(x, y)] = c;
    };

    /** Return a compressed representation of the original virus layout */
    Board.prototype.getLvl = function () {
        return btoa(this._lvl_history.join(""));
    };

    /**
     * Return a compressed version of the changes made to the board
     * Every bytes returned with significant data will have it's most
     * significant bit to 0.
     * 
     * Compression will be used (based on the previous frame), only
     * sending the updated cells. If a byte with the most significant
     * bit is set to 1, the value ( &0x7F ) is a count for how many
     * time to repeat the next value
     */
    Board.prototype.getNewFrame = function (forceReferenceFrame) {
        var frame = null;
        var currentFrame = this._data.slice();
        if (this._previousFrame && (typeof (forceReferenceFrame) === "undefined" || !forceReferenceFrame)) {
            var frame = new Array();

            var zeroCounts = 0;
            for (var i = 0; i < this._size; i++) {
                if (this._previousFrame[i] == currentFrame[i]) {
                    zeroCounts++;
                }
                else {
                    // put in the zeros
                    if (zeroCounts) {
                        // set most significant bit to indicate this is repetitive
                        frame.push(zeroCounts | 0x80);

                        zeroCounts = 0;
                    }
                    // then add the current value
                    frame.push(currentFrame[i]);
                }
            }
            frame = Uint8Array.from(frame);
        }
        else {
            frame = currentFrame.slice();
        }

        // keep a copy of what it is now to to send it back
        this._previousFrame = currentFrame;

        // keep the frame in internal memory
        this._film.push(frame);
        this._filmWeight += frame.length;
        //window.debug.set("FILM SIZE", this._filmWeight);

        return frame;
    };

    
    Board.prototype.playFrame = function(frame) {
        var j = 0;
        for(var i=0;i<frame.length;i++) {
            // decompress
            if(frame[i] & 0x80) {
                j += (frame[i] & 0x7f);
            }
            else {
                this._data[j++] = frame[i];
            }
        }

        var virusCount = 0;
        for(var i=0;i<this._size;i++) {
            if((this._data[i] & Board.CODES.forms.mask) == Board.CODES.forms.values.virus.code)
                virusCount++;
        }

        return {
            updated: frame.length,
            virus: virusCount
        };
    };
    /**
     * Generate a base64 encoded version of the film of this game
     */
    Board.prototype.wrapUpFilm = function() {
        var film = [];
        for(var i=0; i<this._film.length;i++) {    
            film.push(btoa(this._film[i].join("")));
        }

        return film.join(".");
    };

    /**
     * Describe the possible values for each cell of the game area
     * the most siginificant bit should not be used.
     */
    Board.CODES = {
        colors: {
            mask: 0b00000011,
            values: {
                red: {
                    code: 0b00000001,
                    dx: 0
                },
                blue: {
                    code: 0b00000010,
                    dx: 16
                },
                yellow: {
                    code: 0b00000011,
                    dx: 8
                }
            }
        },
        forms: {
            mask: 0b00011100,
            values: {
                single: {
                    code: 0b00000000,
                    dy: 32
                },
                up: {
                    code: 0b00000100,
                    dy: 8
                },
                right: {
                    code: 0b00001000,
                    dy: 16
                },
                down: {
                    code: 0b00001100,
                    dy: 0
                },
                left: {
                    code: 0b00010000,
                    dy: 24
                },
                virus: {
                    code: 0b00010100,
                    dy: [48, 56]
                },
                exploding: {
                    code: 0b00011000,
                    dy: 40
                },
                exploded: {
                    code: 0b00011100,
                    dy: 64
                }
            }
        },
        states: {
            mask: 0b00100000,
            values: {
                alive: {
                    code: 0b00100000,
                    oy: 1,
                    ox: 1
                },
                dead: {
                    code: 0b00000000,
                    oy: 1,
                    ox: 1
                }
            }
        }
    };

    Board.rotate = function (code, counterClockwise) {
        var f = (code & Board.CODES.forms.mask) >> 2;
        f = f + (counterClockwise ? 1 : -1);
        if (f <= 0)
            f = 4;
        else if (f > 4)
            f = 1;

        f <<= 2;

        return f | (code & (0xFF ^ Board.CODES.forms.mask));
    };

    var sprite = document.getElementById("sprite");

    /** Render a cell on the context, based on the code, located at rect */
    Board.renderSprite = function (context, code, x, y, tick) {
        if (code == 0x00)
            return;

        var c = code & Board.CODES.colors.mask;
        var ix = 0, iy = 0;
        for (var k in Board.CODES.colors.values) {
            if (c == Board.CODES.colors.values[k].code) {
                ix = Board.CODES.colors.values[k].dx;
                break;
            }
        }

        var f = code & Board.CODES.forms.mask;
        for (var k in Board.CODES.forms.values) {
            if (f == Board.CODES.forms.values[k].code) {
                iy = Board.CODES.forms.values[k].dy;
                break;
            }
        }

        var s = code & Board.CODES.states.mask;
        for (var k in Board.CODES.states.values) {
            if (s == Board.CODES.states.values[k].code) {
                x += Board.CODES.states.values[k].ox;
                y += Board.CODES.states.values[k].oy;
                break;
            }
        }

        if (iy instanceof Array)
            iy = iy[Math.floor(tick * ANIMATION_TICK_MULTIPLIER) % iy.length];

        context.drawImage(sprite, ix, iy, 8, 8, x, y, 8, 8);
    };

    global[ns] = Board;
})(this, "Board");
