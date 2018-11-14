(function (global, ns) {

    /**
     * Represent a pill that is in motion on the board
     * 
     * @param {Board}       board reference to the board this pill will be added to
     * @param {number}      speed at which the pill will be affected by gravity
     * @param {Board.CODES} a code for the first half of the pill
     * @param {Board.CODES} b code for the 2nd half of the pill, if any
     * @param {number}     x position of the a piece
     * @param {number}   y position of the a piece
     */
    function Pill(board, speed, a, b, x, y) {
        this.board = board;
        this.speed = speed;
        this.a = a;
        this.b = b;
        this.x = x;
        this.y = y;

        this._bufferedMove = null;

        this._move({});
    }

    /** Move the pill without validating destination. Update board */
    Pill.prototype._move = function (update) {
        this.board.fill(this.x, this.y);

        if (this.b) {
            var bPos = this.getBPos()
            this.board.fill(bPos.x, bPos.y);
        }

        for (var k in update)
            this[k] = update[k];

        this.board.fill(this.x, this.y, this.a);
        if (this.b) {
            var bPos = this.getBPos()
            this.board.fill(bPos.x, bPos.y, this.b);
        }
    };

    /** Move the pill left, if possible */
    Pill.prototype.left = function () {
        var dx = -1;
        this._bufferedMove = {
            test: "canTranslate",
            args: [dx,0],
            move: { x: this.x + dx }
        };
        /*
        if (this.canTranslate(dx, 0)) {
            this._move({ x: this.x + dx });
            return true;
        }
        return false;
        */
    };

    /** Move the pill right, if possible */
    Pill.prototype.right = function () {
        var dx = 1;
        this._bufferedMove = {
            test: "canTranslate",
            args: [dx,0],
            move: { x: this.x + dx }
        };
        /*
        var dx = 1;
        if (this.canTranslate(dx, 0)) {
            this._move({ x: this.x + dx });
            return true;
        }
        return false;
        */
    };

    /** Move the pill Vertically (down only), if possible */
    Pill.prototype.down = function () {
        var dy = 1;
        this._bufferedMove = {
            test: "canTranslate",
            args: [0,dy],
            move: { y: this.y + dy }
        };
        /*
        var dy = 1;
        if (this.canTranslate(0, dy)) {
            this._move({ y: this.y + dy });
            return true;
        }
        return false;
        */
    };

    /** Move the pill as low as it will go */
    Pill.prototype.sink = function () {
        // TODO
    };

    /** Rotate the pill Clockwise */
    Pill.prototype.rotate = function (counterClockwise) {
        this._bufferedMove = {
            test: "canRotate",
            args: [counterClockwise],
            move: function() {
                var destB = Board.rotate(this.b, counterClockwise);
                var destA = Board.rotate(this.a, counterClockwise);
                
                // Only "a" will be "down" or "right"
                var bForm = destB | Board.CODES.forms.mask;
                if(bForm == Board.CODES.forms.values.up.code || bForm == Board.CODES.forms.values.right.code) {
                    // switch a & b
                    var t = destA;
                    destA = destB;
                    destB = t;
                }

                return {a:destA, b:destB};
            }
        };  
    };

    /** Rotate the pill Counter-Clockwise */
    Pill.prototype.rotateC = function () {
        return this.rotate(true);
    };

    Pill.prototype.canTranslate = function (dx, dy) {
        var temptative_x = this.x + dx;
        var temptative_y = this.y + dy;
        var temptative_checked = false;
        // validate for b
        if (this.b) {
            var bPos = this.getBPos();

            // if b is where a is going, do not run that check
            if (temptative_x == bPos.x && temptative_y == bPos.y)
                temptative_checked = true;

            bPos.x += dx;
            bPos.y += dy;
            if (this.x == bPos.x && this.y == bPos.y) {
                // a is where b is going to be, no need to validate
            }
            else if (!this.board.isEmptySpace(bPos.x, bPos.y))
                return false;
        }

        // validate target position of a (if is not where b currently is)
        if (!temptative_checked && !this.board.isEmptySpace(temptative_x, temptative_y))
            return false;

        // all check are green!
        return true;
    };

    Pill.prototype.canRotate = function(counterClockwise) {
        var destB = Board.rotate(this.b, counterClockwise);

        var temp = this.getPosFromCode(destB);
        if(!this.board.isEmptySpace(temp.x, temp.y)) {
            return false;
        }

        return true;
    };

    Pill.prototype.getBPos = function () {
        return this.getPosFromCode(this.b);
    };

    Pill.prototype.getPosFromCode = function (code) {
        switch (code & Board.CODES.forms.mask) {
            case Board.CODES.forms.values.right.code: return { x: this.x - 1, y: this.y };
            case Board.CODES.forms.values.left.code: return { x: this.x + 1, y: this.y };
            case Board.CODES.forms.values.up.code: return { x: this.x, y: this.y + 1 };
            case Board.CODES.forms.values.down.code: return { x: this.x, y: this.y - 1 };
        }
        return null;
    };

    Pill.TICK = {
        STUCK: 0,
        MOVED: 1,
        SLEEP: 2
    };

    Pill.prototype.tick = function (tick) {
        if(this._bufferedMove !== null) {
            if( this[this._bufferedMove.test].apply(this, this._bufferedMove.args) ) {
                if(typeof(this._bufferedMove.move) === "function")
                    this._move(this._bufferedMove.move.call(this));
                else
                    this._move(this._bufferedMove.move);
            }

            this._bufferedMove = null;
        }

        if (tick % this.speed == 0) {
            if (!this.canTranslate(0, 1)) {
                // look for grace period
                return Pill.TICK.STUCK;
            }

            this._move({ y: this.y + 1 });
            return Pill.TICK.MOVED;
        }
        return Pill.TICK.SLEEP;
    };

    global[ns] = Pill;

})(this, "Pill");