    /* [MODULE]: player logic */

    var Player = tck.dev.Player;

    /**
     * @constructor
     */
    function CustomPlayer(colour, limit) {

        // properties
        this.colour = colour;
        this.pieces = [];
        this.king = null;
        this.rooks = new Array(2); // [left, right]

        // piece count (for convenience)
        this.numTotal = 0;   // total number of pieces
        this.numByCode = {}; // numbers of pieces by kind (WARNING: undefined)

        // match state
        this.state = CustomPlayer.NORMAL;
        this.opponent = null;
        this.turn = (colour == WHITE);
        this.enPassant = null;
        this.fiftyCount = 0;
        this.enabled = false;

        // counter
        this.timer = null;
        this.limit = limit;           // time limit in minutes
        this.remaining = limit * 60;  // remaining time in seconds
        this.restartFrom = null;      // remaining time on last restart
        this.tcInterval = null;
        this.timerCallback = null;
        this.timeoutCallback = null;
    }

    CustomPlayer.prototype = new Player();
    CustomPlayer.prototype.constructor = CustomPlayer;

    // check or checkmate state (store in MoveResult)
    // IMPORTANT: keep order as "end of game" checks rely on state > 1
    CustomPlayer.NORMAL = 0;
    CustomPlayer.CHECK = 1;
    CustomPlayer.CHECKMATE = 2;
    CustomPlayer.STALEMATE = 3;
    CustomPlayer.DRAW_REPEATS = 4;
    CustomPlayer.DRAW_50 = 5;
    CustomPlayer.DRAW_DEAD = 6;

    CustomPlayer.prototype.namedColour = function() {
        return COLOURS[this.colour];
    };

    CustomPlayer.prototype.isWinner = function() {
        return this.opponent.isLoser();
    };

    CustomPlayer.prototype.isLoser = function() {
        return (this.state == CustomPlayer.CHECKMATE) ||
                ((this.state < CustomPlayer.CHECKMATE) && this.hasTimedOut());
    };

    CustomPlayer.prototype.isDraw = function() {
        return (this.state > CustomPlayer.CHECKMATE);
    };

    CustomPlayer.prototype.arrange = function() {
        this.pieces = PieceFactory.newStartingPieces(this);

        for (var i = 0; i < this.pieces.length; ++i) {
            var piece = this.pieces[i];

            // save convenient king and rook refs
            if (piece instanceof King) {
                this.king = piece;
            } else if (piece instanceof Rook) {

                // 0, 1
                var numRooks = this.numByCode[Rook.CODE];
                if (numRooks === undefined) {
                    numRooks = 0;
                }
                this.rooks[numRooks] = piece;
            }

            // increase piece count
            ++this.numTotal;
            if (this.numByCode[piece.code] === undefined) {
                this.numByCode[piece.code] = 1;
            } else {
                ++this.numByCode[piece.code];
            }

            // draw piece and update board matrix
            piece.draw();
            Board.setPiece(piece.cell, piece);
        }

        GUI.onArrange(this);
    };

    CustomPlayer.prototype.enable = function(enabled) {
        if (!(this.enabled ^ enabled)) {
            return;
        }

        // Piece.enable()/disable() separation for efficiency
        var i = null;
        if (enabled) {
            for (i = 0; i < this.pieces.length; ++i) {
                this.pieces[i].enable();
            }
        } else {
            for (i = 0; i < this.pieces.length; ++i) {
                this.pieces[i].disable();
            }
        }
        this.enabled = enabled;
    };

    CustomPlayer.prototype.setTimerCallback = function(callback, interval) {

        // call every second by default
        if (interval === undefined) {
            interval = 1;
        }
        this.tcInterval = interval;
        this.timerCallback = callback;
    };

    CustomPlayer.prototype.setTimeoutCallback = function(callback) {
        this.timeoutCallback = callback;
    };

    CustomPlayer.prototype.startTimer = function() {
        if (this.limit) {

            // set a mark
            this.restartFrom = this.remaining;

            var _this = this;
            this.timer = setInterval(function() {

                // decrease counter (can be 0 and just waiting
                // for remote timeout)
                if (_this.remaining > 0) {
                    --_this.remaining;
                    GUI.onCount(_this);

                    // invoke callback every 'tcInterval' seconds
                    if (_this.tcInterval) {
                        var passed = _this.restartFrom - _this.remaining;
                        if (passed % _this.tcInterval === 0) {
                            _this.timerCallback(_this);
                        }
                    }

                    // invoke callback on timeout
                    if ((_this.remaining === 0) && _this.timeoutCallback) {
                        _this.timeoutCallback(_this);
                    }
                }
            }, 1000);
        }
    };

    CustomPlayer.prototype.stopTimer = function() {
        if (this.limit) {
            clearInterval(this.timer);
            this.timer = null;
        }
    };

    CustomPlayer.prototype.hasTimedOut = function() {
        return (this.limit > 0) && (this.remaining === 0);
    };

    CustomPlayer.prototype.move = function(piece, to, onEnd) {
        if (piece.cell == to) {
            throw new MoveException('not moving');
        }
        if (!this.turn) {
            throw new MoveException('not your turn');
        }
        if ((this.limit > 0) && (this.remaining === 0)) {
            throw new MoveException('time is over');
        }

        // 1) move validity/safety

        var details = piece.tryMoving(to);
        if (!piece.isSafe(details)) {
            throw new MoveException('king in check');
        }

        // 2) move confirmation

        var disambiguation = this._disambiguate(piece, details);
        this._confirmMove(piece, details);

        // update graphics (asynchronous if castling)
        var _this = this;
        piece.snap(details, function() {

            // 3) post-move operations

            var result = new MoveResult();
            result.piece = piece;
            result.details = details;
            result.disambiguation = disambiguation;

            // pawn promotion, restart flow on user input
            if (details.promoted) {
                GUI.onPromotion(_this, function(prCode) {

                    // promote pawn to chosen piece
                    result.prCode = prCode;
                    result.prPiece = _this._promotePawn(piece, result.prCode);

                    // very last updates
                    _this._finishMove(result);

                    // back to caller, pass result
                    onEnd(result);
                });
            }

            // synchronous operation
            else {

                // very last updates
                _this._finishMove(result);

                // back to caller, pass result
                onEnd(result);
            }
        });
    };

    CustomPlayer.prototype.forceMove = function(result, onEnd) {

        // 1) no validation needed

        // 2) move confirmation

        this._confirmMove(result.piece, result.details);

        // update graphics (always asynchronous)
        var _this = this;
        result.piece.animate(result.details, function() {

            // 3) post-move operations

            // pawn promotion and opponent state update
            if (result.prCode) {
                result.prPiece = _this._promotePawn(result.piece, result.prCode);
            }
            _this.opponent.state = result.oppoState;

            // restore synchronized timer
            if (_this.limit > 0) {
                _this.remaining = result.remaining;
                GUI.onCount(_this);
            }

            GUI.onMove(_this, result);

            // back to caller
            onEnd();
        });
    };

    CustomPlayer.prototype._confirmMove = function(piece, details) {

        // update move count and move piece
        ++piece.moves;
        Board.movePiece(piece, details.to);

        // enter en-passant state
        if (details.epEntered) {
            piece.epFlag = true;
            this.enPassant = piece;
        }

        // opponent leaves en-passant state
        if (this.opponent.enPassant) {
            this.opponent.enPassant.epFlag = false;
            this.opponent.enPassant = null;
        }

        // forget captured piece
        if (details.captured) {
            details.captured.active = false;

            // only remove from board if en-passant (otherwise
            // the cell is occupied by moved piece)
            if (details.epCaptured) {
                Board.setPiece(details.captured.cell, null);
            }

            // update opponent piece count
            --this.opponent.numTotal;
            --this.opponent.numByCode[details.captured.code];
        }

        // move rook if castling
        if (details.castling) {
            Board.movePiece(details.rook, details.rookTo);
        }

        // fifty-moves rule
        if (!details.captured && !(piece instanceof Pawn)) {
            ++this.fiftyCount;
        } else {
            this.fiftyCount = 0;
        }
    };

    CustomPlayer.prototype._promotePawn = function(piece, prCode) {
        var prPiece = piece.promote(prCode);

        // update board matrix
        Board.setPiece(piece.cell, prPiece);

        // replace pawn with promoted piece
        piece.active = false;
        this.pieces[piece.index] = prPiece;

        // update piece count
        --this.numByCode[piece.code];
        ++this.numByCode[prPiece.code];

        return prPiece;
    };

    CustomPlayer.prototype._finishMove = function(result) {

        // opponent state after move
        result.oppoState = this.opponent._computeState();

        // save timer for synchronization
        if (this.limit > 0) {
            result.remaining = this.remaining;
        }

        GUI.onMove(this, result);
    };

    CustomPlayer.prototype._computeState = function() {
        this.state = this._computeStateImpl();
        return this.state;
    };

    // check/checkmate/stalemate algorithm
    CustomPlayer.prototype._computeStateImpl = function() {
        var checked = this.isChecked();

        // all legal moves (XXX: expensive)
        for (var i = 0; i < this.pieces.length; ++i) {
            var p = this.pieces[i];

            // skip inactive
            if (p.active) {
                var list = p.legal();

                // look for safe legal moves
                for (var j = 0; j < list.length; ++j) {
                    var item = list[j];

                    // at least one
                    if (p.isSafe(item)) {
                        return (checked ? CustomPlayer.CHECK : CustomPlayer.NORMAL);
                    }
                }
            }
        }

        // no legal moves
        return (checked ? CustomPlayer.CHECKMATE : CustomPlayer.STALEMATE);
    };

    CustomPlayer.prototype.isChecked = function() {
        return this.opponent.attacks(this.king.cell);
    };

    CustomPlayer.prototype.attacks = function(cell) {
        for (var i = 0; i < this.pieces.length; ++i) {
            var p = this.pieces[i];
            if (p.active && p.findLegal(cell)) {
                return true;
            }
        }
        return false;
    };

    CustomPlayer.prototype.attacksAny = function(cells) {
        for (var i = 0; i < this.pieces.length; ++i) {
            var p = this.pieces[i];
            if (p.active) {
                var list = p.legal();
                for (var j = 0; j < list.length; ++j) {
                    var item = list[j];
                    if ($.inArray(item.to, cells) != -1) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // switch turn
    CustomPlayer.prototype.pass = function() {
        this.turn = false;
        this.opponent.turn = true;
        GUI.onPass(this.opponent, this);
    };

    // calculate disambiguation code whenever two or more
    // similar pieces can reach the same cell
    CustomPlayer.prototype._disambiguate = function(piece, details) {

        // no ambiguity for pawns and kings
        if ((piece instanceof Pawn) || (piece instanceof King)) {
            return null;
        }

        // departure point and destination cell id
        var from = details.from;
        var to = details.to;

        // can other pieces of the same type reach to?
        // (== 1 before promotion, > 2 after promotion)

        // similar pieces through moved piece code
        var similar = this.findByCode(piece.code, undefined);

        // 1) is to a legal move for similar pieces?
        var ambiguous = [];
        for (var i = 0; i < similar.length; ++i) {
            var s = similar[i];
            //if (tck.settings['debug']) {
            //    console.log('AMB: %s can reach:', s.id, s.legal());
            //}

            // skip moved piece or inactive
            if ((s !== piece) && s.active && s.findLegal(to)) {
                ambiguous.push(s);
            }
        }

        // no ambiguity
        if (ambiguous.length === 0) {
            return null;
        }

        if (tck.settings['debug']) {
            console.log('ambiguous pieces: %s', ambiguous.toString());
        }

        // before promotion
        if (ambiguous.length == 1) {
            var point = piece.point();
            var ambPoint = ambiguous[0].point();

            // 2) different depature file? force file
            if (point[1] != ambPoint[1]) {
                return Board.toColumn(point[1]);
            }

            // 3) different depature rank? force rank
            if (point[0] != ambPoint[0]) {
                return Board.toRow(point[0]);
            }

            // unreachable code, ambiguous piece MUST differ in rank/file
            //assert(false);
        }

        // after promotion: explicit departure cell id
        return from;
    };

    // castling rights (doesn't check path existence and move safety)
    CustomPlayer.prototype.canCastle = function() {
        if (this.king.moves > 0) {
            return [false, false];
        }
        var lRook = this.rooks[0];
        var rRook = this.rooks[1];
        return [
            lRook && lRook.active && (lRook.moves === 0),
            rRook && rRook.active && (rRook.moves === 0)
        ];
    };

    // find piece through type code
    CustomPlayer.prototype.findByCode = function(code, active) {
        var similar = [];
        for (var i = 0; i < this.pieces.length; ++i) {
            var p = this.pieces[i];
            if ((p.code == code) &&
                    ((active === undefined) || (p.active == active))) {

                similar.push(p);
            }
        }
        return similar;
    };

    CustomPlayer.isDeadPosition = function(players) {
        var white = players[WHITE];
        var black = players[BLACK];

        // 1vs1 (king is the only left piece)
        if ((white.numTotal == 1) && (black.numTotal == 1)) {
            if (tck.settings['debug']) {
                console.log('DEAD: king vs king!');
            }
            return true;
        }

        // white and black perspectives
        else {
            for (var i = 0; i < players.length; ++i) {
                var me = players[i];
                var opponent = me.opponent;

                // only dealing with 2 pieces scenarios
                if (me.numTotal != 2) {
                    continue;
                }

                // 2vs1
                if (opponent.numTotal == 1) {

                    // (king + knight) vs king
                    if (me.numByCode[Knight.CODE] == 1) {
                        if (tck.settings['debug']) {
                            console.log('DEAD: (king + knight) vs king!');
                        }
                        return true;
                    }

                    // (king + bishop) vs king
                    else if (me.numByCode[Bishop.CODE] == 1) {
                        if (tck.settings['debug']) {
                            console.log('DEAD: (king + bishop) vs king!');
                        }
                        return true;
                    }
                }

                // 2vs2
                else if (opponent.numTotal == 2) {

                    // (king + bishop) vs (king + bishop)
                    if ((me.numByCode[Bishop.CODE] == 1) &&
                            (opponent.numByCode[Bishop.CODE] == 1)) {

                        var mb = me.findByCode(Bishop.CODE, true);
                        var ob = opponent.findByCode(Bishop.CODE, true);

                        // same bishop cells
                        if (Bishop.sameCells(mb[0], ob[0])) {
                            if (tck.settings['debug']) {
                                console.log('DEAD: (king + bishop) vs ' +
                                        '(king + bishop) ' +
                                        'with same bishop cells!');
                            }
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    };

