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

        this._almost = false;
        // TODO make sure the pill starts at the top row (Maybe even one before)
        // TODO check to do the animation of the pill being thrown at the begening of the game
        //      might take care of TODO above

        if(typeof(x) !== "undefined")
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
        if (this.canTranslate(dx, 0)) {
            this._move({ x: this.x + dx });
            Sounds.play("move");
            return true;
        }
        return false;
    };

    /** Move the pill right, if possible */
    Pill.prototype.right = function () {
        var dx = 1;
        if (this.canTranslate(dx, 0)) {
            this._move({ x: this.x + dx });
            Sounds.play("move");
            return true;
        }
        return false;
    };

    /** Move the pill Vertically (down only), if possible */
    Pill.prototype.down = function () {
        var dy = 1;
        if (this.canTranslate(0, dy)) {
            this._move({ y: this.y + dy });
            return true;
        }
        return false;
    };

    /** Move the pill as low as it will go */
    Pill.prototype.sink = function () {
        for( var dy = 1; this.canTranslate(0, dy) ; dy++);
        Sounds.play("fall");
        this._move({
            a: (this.a & (0xff^Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
            b: (this.b & (0xff^Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
            y:this.y+dy-1
        });
    };

    /** Rotate the pill Clockwise */
    Pill.prototype.rotate = function (counterClockwise) {
        var move = {
            a:Board.rotate(this.a, counterClockwise),
            b:Board.rotate(this.b, counterClockwise)
        };

        var bForm = move.b & Board.CODES.forms.mask;

        if(bForm == Board.CODES.forms.values.up.code || bForm == Board.CODES.forms.values.right.code) {
            // switch a & b
            var t = move.a;
            move.a = move.b;
            move.b = t;
        }

        var temp = this.getPosFromCode(move.b);
        if(!this.board.isEmptySpace(temp.x, temp.y)) {
            // if facing up, look of we can shift it left
            var aForm = this.a & Board.CODES.forms.mask;
            if(
                (aForm == Board.CODES.forms.values.up.code) &&
                this.board.isEmptySpace(this.x-1, this.y)
            ) {
                move.x = this.x-1; 
            }
            // if facing right and on the top row
            else if(this.y == 0 && aForm == Board.CODES.forms.values.right.code) {
                // allow it
            }
            else {   
                return false;
            }
        }

        Sounds.play("rotate");

        // Only "a" will be "down" or "right"
        this._move(move); 
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
            else if (bPos.y >= 0 && !this.board.isEmptySpace(bPos.x, bPos.y))
                return false;
        }

        // validate target position of a (if is not where b currently is)
        if (!temptative_checked && !this.board.isEmptySpace(temptative_x, temptative_y))
            return false;

        // all check are green!
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
        ALMOST:1,
        MOVED: 2,
        SLEEP: 3
    };

    Pill.prototype.tick = function (tick) {
        if (tick % this.speed == 0) {
            if (!this.canTranslate(0, 1)) {
                // look for grace period
                if(!this._almost) {
                    this._almost = true;
                    return Pill.TICK.ALMOST;
                }
                else {
                    Sounds.play("fall");
                    return Pill.TICK.STUCK;
                }
            }

            this._almost = false;
            this._move({ y: this.y + 1 });
            return Pill.TICK.MOVED;
        }
        return Pill.TICK.SLEEP;
    };

    global[ns] = Pill;

})(this, "Pill");