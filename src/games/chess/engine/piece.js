    /* [MODULE]: pieces logic */

    /**
     * @constructor
     */
    function Piece() {
    }

    Piece.prototype.baseCtor = function(code, name, value,
            directions, limit, player, cell) {

        // properties
        this.code = code;
        this.name = name;
        this.value = value;
        this.directions = directions;
        this.limit = limit; // Piece.UNLIMITED = no limit
        this.player = player;
        this.colour = player.colour;
        this.cssClass = ['tck', player.namedColour(), name].join('-');
        this.cssClassSm = [this.cssClass, 'sm'].join('-');
        this.enabled = false;

        // set by PieceFactory
        this.id = null;
        this.index = null;

        // set on draw()
        this.img = null;

        // set by CustomPlayer
        this.cell = cell;
        this.active = true;
        this.moves = 0;
    };

    // no step limit
    Piece.UNLIMITED = -1;

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

    // WARNING: only non-null fields are set in details!
    Piece.prototype.tryMoving = function(to) {

        // not interested in other moves than to
        var details = this.findLegal(to);
        if (!details) {
            throw new MoveException('illegal move');
        }

        // legal move, save departure cells
        details.from = this.cell;
        if (details.castling) {
            details.rookFrom = details.rook.cell;
        }

        return details;
    };

    // true if move defined by details doesn't leave the king in check
    // WARNING: must restore previous board state!!!
    Piece.prototype.isSafe = function(details) {
        var from = this.cell;
        var to = details.to;

        // castling: no check before/during/after
        if (details.castling) {
            var point = this.point();
            var middle = null;
            if (details.castling == King.SHORT_CASTLING) {
                middle = Board.coords2Cell(point[0], point[1] + 1);
            } else if (details.castling == King.LONG_CASTLING) {
                middle = Board.coords2Cell(point[0], point[1] - 1);
            }
            var path = [from, middle, to];
            var opponent = this.player.opponent;
            return !opponent.attacksAny(path);
        }

        // any other situation
        else {
            var captured = details.captured;

            // try
            if (captured) {
                Board.setPiece(captured.cell, null);
                captured.active = false;
            }
            Board.movePiece(this, to);

            // true if king in check
            var checked = this.player.isChecked();

            // revert
            Board.movePiece(this, from);
            if (captured) {
                Board.setPiece(captured.cell, captured);
                captured.active = true;
            }

            return !checked;
        }
    };

    // legal move towards to or null if unavailable
    Piece.prototype.findLegal = function(to) {
        var list = this.legal();
        for (var i = 0; i < list.length; ++i) {
            var item = list[i];
            if (to == item.to) {
                return item;
            }
        }
        return null;
    };

    Piece.prototype.legal = function() {
        return this._defaultLegal();
    };

    // all legal moves (default implementation)
    Piece.prototype._defaultLegal = function() {
        var list = [];
        var point = this.point();

        // spread over every direction
        for (var k = 0; k < this.directions.length; ++k) {
            var dir = this.directions[k];

            var i = point[0];
            var j = point[1];
            var steps = 0;
            while (true) {
                i += dir[0];
                j += dir[1];

                // stop on limit reached or board edge
                if ((steps == this.limit) || !Board.isInside(i, j)) {
                    break;
                }

                // look for piece on target
                var next = Board.getBy(i, j);

                // capture enemy
                if (next.piece && (next.piece.colour != this.colour)) {
                    list.push({
                        to: next.cell,
                        captured: next.piece
                    });
                }

                // stop if piece encountered
                if (next.piece) {
                    break;
                }

                // empty cell
                list.push({
                    to: next.cell
                });

                // go ahead
                ++steps;
            }
        }

        return list;
    };

    // snap piece to board (usually after drag and drop)
    Piece.prototype.snap = function(details, onEnd) {
        var $img = $(this.img);

        // snap to grid
        var pos = Board.cell2Pos(details.to);
        $img.css(pos);

        // enqueue castling animation?
        if (details.castling) {
            var rpos = Board.cell2Pos(details.rookTo);
            $(details.rook.img).animate(rpos, function() {
                onEnd();
            });
        } else {
            if (details.captured) {
                details.captured.capture();
            }
            onEnd();
        }
    };

    // move manually
    Piece.prototype.animate = function(details, onEnd) {
        var $img = $(this.img);

        // animation
        var pos = Board.cell2Pos(details.to);
        $img.animate(pos, function() {

            // enqueue castling animation?
            if (details.castling) {
                var rpos = Board.cell2Pos(details.rookTo);
                $(details.rook.img).animate(rpos, function() {
                    onEnd();
                });
            } else {
                if (details.captured) {
                    details.captured.capture();
                }
                onEnd();
            }
        });
    };

    // detach piece and notify capture
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

    // Pawn

    /**
     * @constructor
     */
    function Pawn(player, cell) {

        // can be captured en-passant
        this.epFlag = false;

        // directions/limit unused, Piece.legal() is overriden
        this.baseCtor(Pawn.CODE, Pawn.NAME, Pawn.VALUE,
                null, null, player, cell);
    }

    Pawn.CODE = 'P';
    Pawn.NAME = 'pawn';
    Pawn.VALUE = 1;

    Pawn.prototype = new Piece();
    Pawn.prototype.constructor = Pawn;

    // override
    Pawn.prototype.legal = function() {
        var list = [];
        var point = this.point();

        // useful variables
        var i = null;
        var j = null;
        var next = null;
        var verse = 2 * this.colour - 1; // 0 -> -1, 1 -> 1

        // front cells
        i = point[0] + verse;
        j = point[1];
        if (Board.isInside(i, j)) {
            next = Board.getBy(i, j);

            // first front cell if empty
            if (!next.piece) {
                list.push({
                    to: next.cell,
                    promoted: Board.isBoundary(this.colour, i)
                });

                // second front cell if empty too and pawn is unmoved
                // player enters en-passant state
                // (never reaches boundaries because only calculated on
                // starting position)
                if (this.moves === 0) {
                    i += verse;
                    next = Board.getBy(i, j);

                    if (!next.piece) {
                        list.push({
                            to: next.cell,
                            epEntered: true
                        });
                    }
                }
            }
        }

        // check diagonals (front row, side columns)
        i = point[0] + verse;
        var sidej = [point[1] - 1, point[1] + 1];

        // front diagonal cells (2) occupied by enemies (or en-passant)
        for (var k = 0; k < sidej.length; ++k) {
            j = sidej[k];

            if (Board.isInside(i, j)) {
                next = Board.getBy(i, j);

                // direct capture
                if (next.piece) {
                    if (next.piece.colour != this.colour) {
                        list.push({
                            to: next.cell,
                            captured: next.piece,
                            promoted: Board.isBoundary(this.colour, i)
                        });
                    }
                }

                // en-passant capture
                else {

                    // pawn on the same row
                    var enemy = Board.getPieceBy(point[0], sidej[k]);

                    // must be flagged as en-passant
                    if (enemy && enemy.epFlag &&
                            (enemy.colour != this.colour)) {

                        list.push({
                            to: next.cell,
                            captured: enemy,
                            epCaptured: true
                        });
                    }
                }
            }
        }

        return list;
    };

    Pawn.prototype.promote = function(code) {
        var prPiece = PieceFactory.newPiece(code, this.player, this.cell);

        // copy basic properties into promoted piece
        // IMPORTANT: code suffix guarantees id unicity
        prPiece.id = [this.id, code].join('-');
        prPiece.index = this.index;
        prPiece.img = this.img;
        prPiece.moves = this.moves;

        // replace graphics
        var $img = $(prPiece.img);
        $img.attr('id', prPiece.id);
        $img.removeClass(this.cssClass);
        $img.addClass(prPiece.cssClass);
        $img.data('piece', prPiece);

        return prPiece;
    };

    // Rook

    /**
     * @constructor
     */
    function Rook(player, cell) {
        this.baseCtor(Rook.CODE, Rook.NAME, Rook.VALUE,
                Rook.DIRECTIONS, Piece.UNLIMITED, player, cell);
    }

    Rook.CODE = 'R';
    Rook.NAME = 'rook';
    Rook.VALUE = 5;
    Rook.DIRECTIONS = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1]
    ];

    Rook.prototype = new Piece();
    Rook.prototype.constructor = Rook;

    // Knight

    /**
     * @constructor
     */
    function Knight(player, cell) {
        this.baseCtor(Knight.CODE, Knight.NAME, Knight.VALUE,
                Knight.DIRECTIONS, 1, player, cell);
    }

    Knight.CODE = 'N';
    Knight.NAME = 'knight';
    Knight.VALUE = 3;
    Knight.DIRECTIONS = [
        [-1, -2],
        [-2, -1],
        [-2, 1],
        [-1, 2],
        [1, 2],
        [2, 1],
        [2, -1],
        [1, -2]
    ];

    Knight.prototype = new Piece();
    Knight.prototype.constructor = Knight;

    // Bishop

    /**
     * @constructor
     */
    function Bishop(player, cell) {
        this.baseCtor(Bishop.CODE, Bishop.NAME, Bishop.VALUE,
                Bishop.DIRECTIONS, Piece.UNLIMITED, player, cell);
    }

    Bishop.CODE = 'B';
    Bishop.NAME = 'bishop';
    Bishop.VALUE = 3;
    Bishop.DIRECTIONS = [
        [-1, -1],
        [-1, 1],
        [1, 1],
        [1, -1]
    ];

    Bishop.prototype = new Piece();
    Bishop.prototype.constructor = Bishop;

    // b1 and b2 move on cells of the same colour
    Bishop.sameCells = function(b1, b2) {
        var p1 = b1.point();
        var p2 = b2.point();
        var d1 = (p1[0] + p1[1]) & 1;
        var d2 = (p2[0] + p2[1]) & 1;
        return (d1 == d2);
    };

    // Queen

    /**
     * @constructor
     */
    function Queen(player, cell) {
        this.baseCtor(Queen.CODE, Queen.NAME, Queen.VALUE,
                Queen.DIRECTIONS, Piece.UNLIMITED, player, cell);
    }

    Queen.CODE = 'Q';
    Queen.NAME = 'queen';
    Queen.VALUE = 9;
    Queen.DIRECTIONS = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1]
    ];

    Queen.prototype = new Piece();
    Queen.prototype.constructor = Queen;

    // King

    /**
     * @constructor
     */
    function King(player, cell) {

        // player rooks refs (read only!)
        this.rooks = player.rooks;

        this.baseCtor(King.CODE, King.NAME, King.VALUE,
                King.DIRECTIONS, 1, player, cell);
    }

    King.CODE = 'K';
    King.NAME = 'king';
    King.VALUE = 666; // arbitrary
    King.DIRECTIONS = [ // plus castling cells
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1]
    ];
    King.SHORT_CASTLING = 1;
    King.LONG_CASTLING = 2;
    King.CASTLING = [
        King.LONG_CASTLING, // left rook
        King.SHORT_CASTLING // right rook
    ];

    King.prototype = new Piece();
    King.prototype.constructor = King;

    // override
    King.prototype.legal = function() {
        var list = this._defaultLegal();
        var point = this.point();

        // castling cells
        if (this.moves === 0) {

            // NOTE: king and rook move on same row
            var i = point[0];
            var j = point[1];

            // left (0) and right (1) rook
            for (var k = 0; k < this.rooks.length; ++k) {
                var rook = this.rooks[k];

                // rook unmoved
                if (rook.moves === 0) {

                    // rook coordinates
                    var rpoint = rook.point();
                    var rj = rpoint[1];

                    // 0 -> -1, 1 -> 1
                    var verse = 2 * k - 1;

                    // no pieces between king and rook
                    var free = true;
                    var ej = null;
                    for (ej = j + verse; ej != rj; ej += verse) {
                        var between = Board.getPieceBy(i, ej);
                        if (between) {
                            free = false;
                            break;
                        }
                    }

                    // king and rook paths are free
                    if (free) {
                        var kingCell = Board.coords2Cell(i, j + 2 * verse);
                        var rookCell = Board.coords2Cell(i, j + verse);

                        list.push({
                            to: kingCell,
                            castling: King.CASTLING[k],
                            rook: rook,
                            rookTo: rookCell
                        });
                    }
                }
            }
        }

        return list;
    };

    // singleton
    var PieceFactory = (function() {
        var ROOK_COLUMNS = 'ah';
        var KNIGHT_COLUMNS = 'bg';
        var BISHOP_COLUMNS = 'cf';
        var QUEEN_COLUMN = 'd';
        var KING_COLUMN = 'e';

        function setId(piece, j, columns) {
            var psfx = null;

            // pawn
            if (piece instanceof Pawn) {
                psfx = j + 1;
            }

            // mirrored piece
            else if (!(piece instanceof King) && !(piece instanceof Queen)) {
                psfx = Math.floor(j * 2 / columns) + 1;
            }

            // assemble a meaningful id ('colour-name[-psfx]')
            var pid = ['chess', piece.namedColour(), piece.name];
            if (psfx) {
                pid.push(psfx);
            }
            piece.id = pid.join('-');
        }

        return {
            newPiece: function(code, player, cell) {
                if (code == Rook.CODE) {
                    return new Rook(player, cell);
                } else if (code == Knight.CODE) {
                    return new Knight(player, cell);
                } else if (code == Bishop.CODE) {
                    return new Bishop(player, cell);
                } else if (code == Queen.CODE) {
                    return new Queen(player, cell);
                } else if (code == King.CODE) {
                    return new King(player, cell);
                } else if (code == Pawn.CODE) {
                    return new Pawn(player, cell);
                } else {
                    throw 'invalid piece code: ' + code;
                }
            },

            newStartingPieces: function(player) {
                var list = [];
                var sranks = Board.startingRanks(player.colour);
                var x = null;
                var y = null;
                var j = 0;
                var piece = null;

                // back row (strong pieces)
                y = sranks[0];
                for (j = 0; j < Board.size; ++j) {
                    x = Board.toColumn(j);
                    var cell = x + y;
                    piece = null;

                    // the king
                    if (x == KING_COLUMN) {
                        piece = new King(player, cell);
                    }

                    // the queen
                    else if (x == QUEEN_COLUMN) {
                        piece = new Queen(player, cell);
                    }

                    // mirrored piece
                    else {
                        if (ROOK_COLUMNS.indexOf(x) != -1) {
                            piece = new Rook(player, cell);
                        } else if (KNIGHT_COLUMNS.indexOf(x) != -1) {
                            piece = new Knight(player, cell);
                        } else if (BISHOP_COLUMNS.indexOf(x) != -1) {
                            piece = new Bishop(player, cell);
                        }
                    }

                    // .id and .index
                    setId(piece, j, Board.size);
                    piece.index = list.length;

                    list.push(piece);
                }

                // front row (pawns)
                y = sranks[1];
                for (j = 0; j < Board.size; ++j) {
                    x = Board.toColumn(j);
                    piece = new Pawn(player, x + y);

                    // .id and .index
                    setId(piece, j, Board.size);
                    piece.index = list.length;

                    list.push(piece);
                }

                return list;
            }
        };
    })();

