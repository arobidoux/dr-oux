(function (global, ns) {
    const SPEED_FACTOR = 16;
    const ANIMATION_TICK_MULTIPLIER = .25;
    const SUITE_MIN_LENGTH = 3;
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

        /** Full representation of the board on 1 string
         * Rows are represented from top to bottom, left to right
         * horizontal value are consecutive, vertical values are
         * offseted by this._width
         */
        if (typeof (Uint8Array) !== "undefined")
            this._data = new Uint8Array(this._size).fill(0);
        else
            this._data = new Array(this._size).fill(0);

        this._pills = [];
        this._ownedPill = null;
        this._generateNextOwnPillOn = 0;
    }

    Board.SPEED = {
        SLOW: 1,
        NORMAL: 2,
        FAST: 4,
    };

    Board.prototype.registerInputs = function(input) {
        inputs.register("RIGHT", this.action.bind(this,"right"), 1/ANIMATION_TICK_MULTIPLIER);
        inputs.register("LEFT", this.action.bind(this,"left"), 1/ANIMATION_TICK_MULTIPLIER);
        inputs.register("DOWN", this.action.bind(this,"down"), 1/ANIMATION_TICK_MULTIPLIER);
        inputs.register("UP", this.action.bind(this,"sink"), 1/ANIMATION_TICK_MULTIPLIER);
        inputs.register("ROTATE_CLOCKWISE", this.action.bind(this,"rotate"));
        inputs.register("ROTATE_COUNTER_CLOCKWISE", this.action.bind(this,"rotateC"));
    };

    Board.prototype.destroyCell = function (x, y) {
        var p = this.coordToPos(x, y);
        var f = this._data[p] & Board.CODES.forms.mask;

        // update double pill
        var delta = 0;
        switch(f) {
            case Board.CODES.forms.values.up.code: delta = -1 * this._width; break;
            case Board.CODES.forms.values.down.code: delta = this._width; break;
            case Board.CODES.forms.values.left.code: delta = -1; break;
            case Board.CODES.forms.values.right.code: delta = 1; break;
        }
        if(delta) {
            var p2 = p+delta;
            if(p2 > 0 && p2 < this._size) {
                this._data[p2] = this._data[p2] & Board.CODES.colors.mask;
            }
        }

        // update the _pills
        for(var i=0;i<this._pills.length;i++) {
            if(this._pills[i].a != 0x00 && this._pills[i].x == x && this._pills[i].y == y)
                this._pills[i].a = 0x00;
            else if(this._pills[i].b != 0x00) {
                var bPos = this._pills[i].getBPos();
                if(bPos.x == x && bPos.y == y)
                    this._pills[i].b = 0x00;
            }

            if(this._pills[i].a == 0x00 && this._pills[i].b == 0x00) {
                this._pills.splice(i--, 1);
            }
        }

        this._data[p] = Board.CODES.forms.values.exploding.code | (this._data[p] & Board.CODES.colors.mask);
    }

    Board.prototype._checkPillDestruction = function (x, y) {
        var l = this.getColorLength(x, y);

        var destroyed = false;

        if (l.u + l.d >= SUITE_MIN_LENGTH) {
            for (var i = 0; i <= l.u; i++)
                this.destroyCell(x, y - i);
            for (var i = 1; i <= l.d; i++)
                this.destroyCell(x, y + i);
            destroyed = true;
        }

        if (l.l + l.r >= SUITE_MIN_LENGTH) {
            for (var i = 0; i <= l.l; i++)
                this.destroyCell(x - i, y);
            for (var i = 1; i <= l.r; i++)
                this.destroyCell(x + i, y);
            destroyed = true;
        }
        return destroyed;
    };

    Board.prototype._tickPill = function (pill, tick) {
        var r = pill.tick(tick);
        switch (r) {
            case Pill.TICK.STUCK:
                // validate if we have broken anything
                
                if( pill.a != 0x00 && this._checkPillDestruction(pill.x, pill.y) ) {
                    pill.a = 0x00;
                }

                if (pill.b != 0x00) {
                    var bPos = pill.getBPos();
                    if(this._checkPillDestruction(bPos.x, bPos.y)) {
                        pill.b = 0x00;
                    }
                }

                if(pill.a == 0x00 && pill.b == 0x00) {
                    return -1;
                }

            case Pill.TICK.MOVED:
                // update board
                break;
            case Pill.TICK.SLEEP:
                // nothing to do
                break;
        }
        return r;
    };

    Board.prototype.tick = function (tick) {
        // cleanup completed explosion
        this.each_raw(function (code, i) {
            if ((code & Board.CODES.forms.mask) == Board.CODES.forms.values.exploding.code) {
                this._data[i] = 0x00;
            }
        }.bind(this));

        if (this._ownedPill) {
            switch(this._tickPill(this._ownedPill, tick)) {
                case -1:
                    this._ownedPill = null;
                    break;
                case Pill.TICK.STUCK:
                    // make the pill move at every tick
                    this._ownedPill.speed = 1;
                    this._pills.push(this._ownedPill);
                    this._ownedPill = null;
                    break;
                // no need to handle the rest
                default:;
            }
        }

        // if no current main pill is in effect, tick the rest
        else {
            var pillMoved = [];
            do {
                var change_made = false;
                for (var i = 0; i < this._pills.length; i++) {
                    if(pillMoved.indexOf(i) !== -1)
                        continue;

                    switch(this._tickPill(this._pills[i], tick)) {
                        // do nothing in those cases
                        case Pill.TICK.STUCK: break;
                        
                        // remove the pill, it is all destroyed
                        case -1:
                            this._pills.splice(i--,1); 
                            // intentional no break;
                        
                        case Pill.TICK.SLEEP:
                            // intentional no break;
                        case Pill.TICK.MOVED:
                            pillMoved.push(i);
                            change_made = true;
                            break;
                    }
                }
            } while(change_made);
            
            // done updating the falling pills, throw the new one
            if(pillMoved.length == 0) {
                if (this._generateNextOwnPillOn == 0) {
                    // queue next one
                    this._generateNextOwnPillOn = tick + this._effective_speed;
                }
                else if (this._generateNextOwnPillOn >= tick) {
                    this._generateNextOwnPillOn = 0;
                    // insert a new pill
                    this.insertNextPill();
                }
                else {
                    // wait, patiently
                }
            }
        }
    };

    Board.prototype.action = function (method) {
        if (!this._ownedPill)
            return;

        this._ownedPill[method]();
    };

    Board.prototype.insertNextPill = function () {
        var x = (this._width / 2) - 1;
        var y = 0;

        if (this.isEmptySpace(x, y) && this.isEmptySpace(x + 1, y)) {
            this._ownedPill = new Pill(
                this,
                this._effective_speed,
                //Board.CODES.colors.values.red.code | Board.CODES.forms.values.right.code,
                //Board.CODES.colors.values.blue.code | Board.CODES.forms.values.left.code,
                Math.floor(Math.random() * Board.CODES.colors.mask) + 1 | Board.CODES.forms.values.right.code,
                Math.floor(Math.random() * Board.CODES.colors.mask) + 1 | Board.CODES.forms.values.left.code,
                x, y
            );
        }
        else {
            throw new Error("Game Over");
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

    Board.isVirus = function (code) {
        return (code & Board.CODES.forms.mask) == Board.CODES.forms.values.virus.code;
    };

    Board.isUp = function (code) {
        return (code & Board.CODES.forms.mask) == Board.CODES.forms.values.up.code;
    };

    Board.isDown = function (code) {
        return (code & Board.CODES.forms.mask) == Board.CODES.forms.values.down.code;
    };

    Board.isLeft = function (code) {
        return (code & Board.CODES.forms.mask) == Board.CODES.forms.values.left.code;
    };

    Board.isRight = function (code) {
        return (code & Board.CODES.forms.mask) == Board.CODES.forms.values.right.code;
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
            throw new error("Invalid difficulty, to high");
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
                }
            }
        }
    };

    Board.rotate = function(code, counterClockwise) {
        var f = (code & Board.CODES.forms.mask) >> 2;
        f = f + (counterClockwise ? 1 : -1);
        if(f <= 0)
            f = 4;
        else if(f > 4)
            f = 1;

        f <<= 2;

        return f | (code & (0xFF^Board.CODES.forms.mask));
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

        if (iy instanceof Array)
            iy = iy[Math.floor(tick*ANIMATION_TICK_MULTIPLIER) % iy.length];

        context.drawImage(sprite, ix, iy, 8, 8, x, y, 8, 8);
    };

    global[ns] = Board;
})(this, "Board");
