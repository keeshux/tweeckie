    /* [MODULE]: pieces logic */

    /**
     * @constructor
     */
    function Piece() {
    }

    Piece.prototype.baseCtor = function(code, name, value,
            directions, player, cell) {

        // properties
        this.code = code;
        this.name = name;
        this.value = value;
        this.directions = directions;
        this.player = player;
        this.colour = player.colour;
        this.cssClass = ['tck', player.namedColour(), name].join('-');
        this.cssClassSm = [this.cssClass, 'sm'].join('-');
        this.enabled = false;

        // set on draw()
        this.img = null;

        // set by CustomPlayer
        this.cell = cell;
        this.id = null;
        this.index = null;
        this.active = true;
        this.moves = 0;
    };

    Piece.prototype.namedColour = function() {
        return COLOURS[this.colour];
    };

    Piece.prototype.point = function() {
        return Board.cell2Point(this.cell);
    };

    Piece.prototype.draw = function() {
        this.img = Board.appendPiece(this);
    };

    Piece.prototype.enable = function() {
        var $img = $(this.img);
        $img.addClass('tck-piece-enabled');
        $img.draggable('enable');
        this.enabled = true;
    };

    Piece.prototype.disable = function() {
        var $img = $(this.img);
        $img.removeClass('tck-piece-enabled');
        $img.draggable('disable');
        this.enabled = false;
    };

    // returns a list of cells
    Piece.prototype.adjacent = function() {
        var adjacent = [];
        var point = this.point();

        for (var k = 0; k < this.directions.length; ++k) {
            var dir = this.directions[k];

            // near cell
            var i = point[0] + dir[0];
            var j = point[1] + dir[1];
            if (Board.isInside(i, j)) {
                var adj = Board.getBy(i, j);

                // empty adjacent cell?
                if (!adj.piece) {
                    adjacent.push(adj.cell);
                }
            }
        }

        return adjacent;
    };

    // returns a list of {path, capture} objects
    Piece.prototype.jumps = function() {
        var result = [];
        var point = this.point();

        for (var k = 0; k < this.directions.length; ++k) {
            var dir = this.directions[k];

            // include starting cell in path
            this._addJump(result, point[0], point[1], dir, [this.cell], []);
        }

        return result;
    };

    // true if recursing, false otherwise
    Piece.prototype._addJump = function(result, i, j, dir, path, capture) {
        //var spaces = new Array(path.length).join('  ');

        //console.log('%sfollow [%d, %d]', spaces, dir[0], dir[1]);

        // near cell
        i += dir[0];
        j += dir[1];
        if (Board.isInside(i, j)) {
            var middle = Board.getBy(i, j);

            // adjacent cell is not empty, can only jump over
            // same/less valued enemies (italian checkers)
            if (middle.piece && (middle.piece.colour != this.colour) &&
                    (middle.piece.value <= this.value)) {

                // do not capture twice
                if ($.inArray(middle.cell, capture) != -1) {
                    //console.log('%salready captured %d', spaces, middle.cell);
                    return false;
                }

                // far cell
                i += dir[0];
                j += dir[1];
                if (Board.isInside(i, j)) {
                    var jump = Board.getBy(i, j);

                    // can land if no piece in destination or looping
                    if (!jump.piece || (jump.piece === this)) {
                        var moreSteps = false;

                        //console.log('%sjumping to: (%d, %d)', spaces, i, j);

                        // recurse
                        for (var k = 0; k < this.directions.length; ++k) {
                            var subDir = this.directions[k];

                            // IMPORTANT: don't go back on the same direction!
                            if ((subDir[0] != -dir[0]) ||
                                    (subDir[1] != -dir[1])) {

                                // append new origin and captured piece
                                var subPath = path.concat([jump.cell]);
                                var subCapture = capture.concat([middle.cell]);

                                // room for moving?
                                moreSteps |= this._addJump(result, i, j,
                                        subDir, subPath, subCapture);
                            }
                        }

                        // subpath is complete if no more steps are allowed
                        if (!moreSteps) {
                            result.push({
                                path: subPath,
                                capture: subCapture
                            });
                            //console.log('%sadded path %O (capture %O)', spaces, subPath, subCapture);
                        }

                        return true;
                    }
                }
            }
        }

        //console.log('%sblocked!', spaces);

        // cannot go farther
        return false;
    };

    // short-circuit tester function
    Piece.prototype.canMove = function() {
        var point = this.point();

        for (var k = 0; k < this.directions.length; ++k) {
            var dir = this.directions[k];

            // adjacent
            var i = point[0] + dir[0];
            var j = point[1] + dir[1];
            if (Board.isInside(i, j)) {
                var adj = Board.getBy(i, j);

                // can move to adjacent cell
                if (!adj.piece) {
                    return true;
                }

                // jump
                i += dir[0];
                j += dir[1];
                if (Board.isInside(i, j)) {
                    var jump = Board.getBy(i, j);

                    // can jump to far cell
                    if ((adj.piece.colour != this.colour) && !jump.piece) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // snap piece to board (usually after drag and drop)
    Piece.prototype.snap = function(to, cpiece) {
        var $img = $(this.img);

        // snap to grid
        var pos = Board.cell2Pos(to);
        $img.css(pos);

        // remove captured piece (if any)
        if (cpiece) {
            cpiece.capture();
        }
    };

    // move manually (step by step)
    Piece.prototype.animate = function(result, onEnd) {
        var $img = $(this.img);

        // skip starting cell
        for (var i = 1; i < result.path.length; ++i) {
            var step = result.path[i];

            // coordinates
            var pos = Board.cell2Pos(step);

            // add animation step (closure)
            $img.animate(pos, (function(i) {
                return function() {

                    // next piece to capture (if any)
                    if (result.captured) {
                        var cc = result.captured[i - 1];
                        var cpiece = Board.getPiece(cc);
                        cpiece.capture();
                    }

                    // last step, back to caller
                    if (i == result.path.length - 1) {
                        onEnd();
                    }
                };
            })(i));
        }
    };

    // remove from DOM
    Piece.prototype.capture = function() {
        $(this.img).detach();
        GUI.onCapture(this);
    };

    Piece.prototype.toString = function() {
        return this.code + this.cell;
    };

    Piece.prototype.toTypeString = function() {
        return SHORT_COLOURS[this.colour] + this.code;
    };

    // Man

    /**
     * @constructor
     */
    function Man(player, cell) {
        this.baseCtor(Man.CODE, Man.NAME, Man.VALUE,
                Man.DIRECTIONS[player.colour], player, cell);
    }

    Man.CODE = 'M';
    Man.NAME = 'man';
    Man.VALUE = 1;
    Man.DIRECTIONS = [
        [
            [-1, -1],
            [-1, 1]
        ],
        [
            [1, -1],
            [1, 1]
        ]
    ];

    Man.prototype = new Piece();
    Man.prototype.constructor = Man;

    Man.prototype.crown = function() {
        var crPiece = new King(this.player, this.cell);

        // copy basic properties into crowned piece
        // IMPORTANT: code suffix guarantees id unicity
        crPiece.id = [this.id, crPiece.code].join('-');
        crPiece.img = this.img;
        crPiece.moves = this.moves;

        // replace graphics
        var $img = $(crPiece.img);
        $img.attr('id', crPiece.id);
        $img.removeClass(this.cssClass);
        $img.addClass(crPiece.cssClass);
        $img.data('piece', crPiece);

        return crPiece;
    };

    // King

    /**
     * @constructor
     */
    function King(player, cell) {
        this.baseCtor(King.CODE, King.NAME, King.VALUE,
                King.DIRECTIONS, player, cell);
    }

    King.CODE = 'K';
    King.NAME = 'king';
    King.VALUE = 2;
    King.DIRECTIONS = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
    ];

    King.prototype = new Piece();
    King.prototype.constructor = King;

