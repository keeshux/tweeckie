    /* [MODULE]: controller */

    var Game = tck.dev.Game;

    /**
     * @constructor
     */
    function CustomGame(connection, cfg) {
        this.connection = connection;

        // invited with opposite colour
        if (cfg['invited']) {
            cfg['colour'] = tck.utils.invert(cfg['colour']);
        }

        var _this = this;

        // synchronize own remote counter every 'syncInterval' seconds
        this.local = new CustomPlayer(cfg['colour'], cfg['limit']);
        if (!this.testing) {
            this.local.setTimerCallback(function (p) {
                _this.connection.broadcast({
                    'msg': 'sync',
                    'remaining': p.remaining
                });
            }, tck.settings['syncInterval']);
        }

        // IMPORTANT: for consistency across the network, only
        // counter owners should notify timeout
        this.local.setTimeoutCallback(function (p) {

            // XXX: spinlock for mutual exclusion!
            while (_this.localMoving) {}

            GUI.onTimeout(p);

            // send timeout to remote
            if (!_this.testing) {
                _this.connection.broadcast({
                    'msg': 'timeout'
                });
            }
        });

        this.remote = new CustomPlayer(tck.utils.invert(this.local.colour), cfg['limit']);

        // face opponents
        this.local.opponent = this.remote;
        this.remote.opponent = this.local;

        this.localMoving = false;
        this.positions = [];
    }

    CustomGame.prototype = new Game();
    CustomGame.prototype.constructor = CustomGame;

    // overrides

    // [white, black]
    CustomGame.prototype['getPlayers'] = function() {
        if (this.local.colour == WHITE) {
            return [this.local, this.remote];
        } else {
            return [this.remote, this.local];
        }
    };

    CustomGame.prototype['start'] = function() {

        // rotate board if playing black
        var rotated = (this.local.colour == BLACK);
        GUI.initialize(this, rotated);

        this.local.arrange();
        this.remote.arrange();
        if (this.local.turn) {
            this.local.enable(true);
            this.local.startTimer();

            // notify ready state
            if (!this.testing) {
                this.connection.send({
                    'msg': 'ready'
                });
            }
        } else {
            this.remote.startTimer();
        }

        this.state = Game.STARTED;
    };

    CustomGame.prototype['stop'] = function() {
        this.local.enable(false);
        this.local.stopTimer();
        this.remote.enable(false);
        this.remote.stopTimer();

        this.state = Game.ENDED;
    };

    CustomGame.prototype['reset'] = function() {
        if (this.local) {
            this.local.enable(false);
            this.local.stopTimer();
        }
        if (this.remote) {
            this.remote.enable(false);
            this.remote.stopTimer();
        }

        // reset variables
        this.state = Game.INIT;
        this.connection = null;
        this.local = null;
        this.remote = null;

        this.localMoving = false;
        this.positions = [];
    };

    CustomGame.prototype['onMessage'] = function(json) {
        var msg = json['msg'];

        // remote player moved a piece
        if (msg == 'move') {
            var result = CustomGame._unpackResult(json['result']);
            this.remoteMove(result);

            // ready to move
            this.connection.send({
                'msg': 'ready'
            });
        }

        // synchronization
        else if (msg == 'ready') {

            // start opponent timer if match is not over
            if (this.state == Game.STARTED) {
                this.remote.startTimer();
            }
        } else if (msg == 'sync') {
            var remaining = json['remaining'];
            this.remote.remaining = remaining;

            GUI.onCount(this.remote);
        } else if (msg == 'timeout') {
            GUI.onTimeout(this.remote);
        }
    };

    // local methods

    // GUI: piece moved locally (local)
    CustomGame.prototype.move = function(piece, to) {
        //assert(piece.player == this.local);
        var player = piece.player;

        // game has yet to begin
        if (this.state != Game.STARTED) {
            throw new MoveException('game not started');
        }

        // try moving
        try {

            // XXX: mutual exclusion with timeout
            this.localMoving = true;

            // try moving
            var _this = this;
            player.move(piece, to, function(result) {
                CustomGame._logMove(result);

                // actions after each move
                _this._afterMove(result);

                // testing: start opponent timer immediately
                if (_this.testing) {
                    if (_this.state != Game.ENDED) {
                        player.opponent.enable(true);
                        player.opponent.startTimer();
                    }
                }

                // production: disable player and send move
                //             result across the network
                else {
                    player.enable(false);
                    var packedResult = CustomGame._packResult(result);
                    _this.connection.broadcast({
                        'msg': 'move',
                        'result': packedResult
                    });
                }
            });
        } catch (e) {
            if (e instanceof MoveException) {
                CustomGame._logError(piece, to, e);
            }
            throw e;
        } finally {

            // XXX: mutual exclusion with timeout
            this.localMoving = false;
        }
    };

    // MQ: piece moved remotely (remote)
    CustomGame.prototype.remoteMove = function(result) {
        //assert(result.piece.player == this.remote);

        // move directly
        var _this = this;
        this.remote.forceMove(result, function() {
            CustomGame._logMove(result);

            // actions after each move
            _this._afterMove(result);

            // only re-enable local player if still playing
            if (_this.state == Game.STARTED) {
                _this.local.enable(true);
                _this.local.startTimer();
            }
        });
    };

    // common logic after move() and remoteMove()
    CustomGame.prototype._afterMove = function(result) {
        var me = result.piece.player;
        var opponent = me.opponent;

        // opponent's turn
        me.pass();
        me.stopTimer();

        // end for checkmate
        if (opponent.state == CustomPlayer.CHECKMATE) {
            GUI.onWin(me, opponent);
        }

        // end for stalemate
        else if (opponent.state == CustomPlayer.STALEMATE) {
            GUI.onDraw(opponent.state);
        }

        // end for draw
        else {
            var drawState = this._checkDraw();
            if (drawState) {
                me.state = drawState;
                opponent.state = drawState;
                GUI.onDraw(drawState);
            }
        }
    };

    // return draw possibility (conditions sorted by frequency)
    CustomGame.prototype._checkDraw = function() {
        var players = this.getPlayers();

        // 1) insufficient material

        if (CustomPlayer.isDeadPosition(players)) {
            if (tck.settings['debug']) {
                console.log('DRAW: dead position!');
            }
            return CustomPlayer.DRAW_DEAD;
        }

        // 2) same position repeated 3 times

        var pos = new Position(this.local, this.remote);
        this.positions.push(pos);
        var repeats = tck.utils.arrayCount(this.positions, pos, Position.equals);
        if (tck.settings['debug']) {
            console.log('DRAW: position repeated %d times', repeats);
        }
        var threeRepeats = (repeats == 3);
        if (threeRepeats) {
            if (tck.settings['debug']) {
                console.log('DRAW: 3 repeats!');
            }
            return CustomPlayer.DRAW_REPEATS;
        }

        // 3) 50 moves with no pawn moves or captures

        var lowestFifty = Math.min(this.local.fiftyCount, this.remote.fiftyCount);
        if (tck.settings['debug']) {
            console.log('DRAW: no pawn moves or captures: %d', lowestFifty);
        }
        var fiftyMoves = (lowestFifty == 50);
        if (fiftyMoves) {
            if (tck.settings['debug']) {
                console.log('DRAW: 50 moves!');
            }
            return CustomPlayer.DRAW_50;
        }

        // no conditions for draw
        return null;
    };

    // MoveResult -> string
    CustomGame._packResult = function(m) {
        var obj = {};

        // move

        var details = m.details;
        obj['from'] = details.from;
        obj['to'] = details.to;
        obj['ep'] = details.epEntered;
        if (details.captured) {
            obj['cpt'] = {
                'cell': details.captured.cell,
                'ep': details.epCaptured
            };
        }
        if (details.castling) {
            obj['castling'] = {
                'type': details.castling,
                'rfrom': details.rookFrom,
                'rto': details.rookTo
            };
        }

        // post-move

        if (m.disambiguation) {
            obj['disamb'] = m.disambiguation;
        }
        if (m.prCode) {
            obj['pr'] = m.prCode;
        }
        obj['os'] = m.oppoState;

        // optional

        if (m.remaining) {
            obj['rem'] = m.remaining;
        }

        if (tck.settings['debug']) {
            console.log('packResult:', m, obj);
        }
        return obj;
    };

    // string -> MoveResult
    CustomGame._unpackResult = function(json) {
        var m = new MoveResult();
        var details = {};

        // move

        details.from = json['from'];
        details.to = json['to'];
        details.epEntered = json['ep'];
        var cpt = json['cpt'];
        if (cpt) {
            details.captured = Board.getPiece(cpt['cell']);
            details.epCaptured = cpt['ep'];
        }
        var castling = json['castling'];
        if (castling) {
            details.castling = castling['type'];
            details.rookFrom = castling['rfrom'];
            details.rookTo = castling['rto'];
            details.rook = Board.getPiece(details.rookFrom);
        }
        m.piece = Board.getPiece(details.from);
        m.details = details;

        // post-move

        var disamb = json['disamb'];
        if (disamb) {
            m.disambiguation = disamb;
        }
        var pr = json['pr'];
        if (pr) {
            m.prCode = pr;
            m.prPiece = null;
            m.details.promoted = true;
        }
        m.oppoState = json['os'];

        // optional

        var rem = json['rem'];
        if (rem) {
            m.remaining = rem;
        }

        if (tck.settings['debug']) {
            console.log('unpackResult:', json, m);
        }

        return m;
    };

    // logging

    CustomGame._logMove = function(result) {
        if (!tck.settings['debug']) {
            return;
        }

        Board.print();

        var piece = result.piece;
        var details = result.details;

        // move
        var cpt = '-';  // cell of captured piece
        var cstl = '-'; // type of castling
        if (details.captured) {
            cpt = details.captured.cell;
            if (details.epCaptured) {
                cpt += ' (ep)';
            }
        }
        if (details.castling == King.SHORT_CASTLING) {
            cstl = 'short';
        } else if (details.castling == King.LONG_CASTLING) {
            cstl = 'long';
        }

        // post-move
        var prom = '-'; // type of promotion
        var os = '-';   // opponent state
        if (result.prCode) {
            prom = result.prCode;
        }
        if (result.oppoState == CustomPlayer.CHECK) {
            os = 'check';
        } else if (result.oppoState == CustomPlayer.CHECKMATE) {
            os = 'checkmate';
        } else if (result.oppoState == CustomPlayer.STALEMATE) {
            os = 'stalemate';
        }

        // extensive move description
        console.log('%s result: ', piece.namedColour(), result);
        console.log(
            '%s: %s-%s, cpt: %s, cstl: %s, prom: %s, os: %s',
            piece.id,
            details.from,
            details.to,
            cpt,
            cstl,
            prom,
            os
        );

        // piece count
        var player = piece.player;
        var white = (player.colour == WHITE) ? player : player.opponent;
        var black = white.opponent;
        console.log('white pieces: ', white.numTotal, white.numByCode);
        console.log('black pieces: ', black.numTotal, black.numByCode);
    };

    CustomGame._logError = function(piece, to, e) {
        if (!tck.settings['debug']) {
            return;
        }

        console.log(
            '%s: %s-%s, e: "%s"',
            piece.id,
            piece.cell,
            to,
            e.msg
        );
    };

    /**
     * @constructor
     */
    // position (board state, en-passant pawns, castling rights)
    function Position(local, remote) {
        this.serBoard = Board.serialize();

        var ls = [
            (local.enPassant ? local.enPassant.id : null),
            local.canCastle()
        ];
        var rs = [
            (remote.enPassant ? remote.enPassant.id : null),
            remote.canCastle()
        ];

        // state strings
        this.localState = ls.join(',');
        this.remoteState = rs.join(',');
    }

    Position.prototype.toString = function() {
        var props = [
            this.serBoard,
            this.localState,
            this.remoteState
        ];
        return props.join(':');
    };

    Position.equals = function(p1, p2) {
        return (p1.toString() == p2.toString());
    };

