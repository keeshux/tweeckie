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

        this.local = new CustomPlayer(cfg['colour']);
        this.remote = new CustomPlayer(tck.utils.invert(this.local.colour));

        // face opponents
        this.local.opponent = this.remote;
        this.remote.opponent = this.local;
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
        }

        this.state = Game.STARTED;
    };

    CustomGame.prototype['stop'] = function() {
        this.local.enable(false);
        this.remote.enable(false);

        this.state = Game.ENDED;
    };

    CustomGame.prototype['reset'] = function() {
        if (this.local) {
            this.local.enable(false);
        }
        if (this.remote) {
            this.remote.enable(false);
        }

        // reset variables
        this.state = Game.INIT;
        this.connection = null;
        this.local = null;
        this.remote = null;
    };

    CustomGame.prototype['onMessage'] = function(json) {
        var msg = json['msg'];

        // remote player moved a piece
        if (msg == 'move') {
            var result = CustomGame._unpackResult(json['result']);
            this.remoteMove(result);
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
            var result = player.move(piece, to);
            CustomGame._logMove(result);
            if (!result.complete) {
                return;
            }

            // actions after each move
            this._afterMove(result);

            // testing: enable opponent
            if (this.testing) {
                if (this.state != Game.ENDED) {
                    player.opponent.enable(true);
                }
            }

            // production: disable player and send move
            //             result across the network
            else {
                player.enable(false);
                var packedResult = CustomGame._packResult(result);
                this.connection.broadcast({
                    'msg': 'move',
                    'result': packedResult
                });
            }
        } catch (e) {
            if (e instanceof MoveException) {
                CustomGame._logError(piece, to, e);
            }

            throw e;
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
            }
        });
    };

    // common logic after move() and remoteMove()
    CustomGame.prototype._afterMove = function(result) {
        var me = result.piece.player;
        var opponent = me.opponent;

        // opponent's turn
        me.pass();

        // only recalculate captures on local player or in testing
        // (calculations are heavy and opponent does them already)
        if ((opponent === this.local) || this.testing) {
            opponent.updateCaptureSpan();
        }

        // winning move
        if (result.won) {
            GUI.onWin(me, opponent);
        }

        // TODO: draw
        else {
            /*var drawState = checkDraw();
            if (drawState) {
                me.state = drawState;
                opponent.state = drawState;
                GUI.onDraw(drawState);
            }*/
        }
    };

    // MoveResult -> string
    CustomGame._packResult = function(m) {
        var obj = {};

        // mandatory fields
        obj['path'] = m.path;
        obj['won'] = m.won;

        // optional fields
        if (m.captured) {
            obj['captured'] = m.captured;
        }
        if (m.crowned) {
            obj['crowned'] = (m.crowned !== null);
        }

        if (tck.settings['debug']) {
            console.log('packResult:', m, obj);
        }
        return obj;
    };

    // string -> MoveResult
    CustomGame._unpackResult = function(json) {
        var m = null;

        // mandatory fields
        var path = json['path'];
        var piece = Board.getPiece(path[0]);
        m = new MoveResult(true, piece, path);
        m.won = json['won'];

        // optional fields
        var captured = json['captured'];
        if (captured) {
            m.captured = captured;
        }
        var crowned = json['crowned'];
        if (crowned) {
            m.crowned = piece;
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
        var cpt = '';
        if (result.captured) {
            cpt = result.captured.join(',');
        }

        console.log('%s result: ', piece.namedColour(), result);
        console.log(
            '%s: [%s], cpt: [%s], crowned: %s, complete: %s, winning: %s',
            piece.id,
            result.path.join(','),
            cpt,
            (result.crowned !== null),
            result.complete,
            result.won
        );
    };

    CustomGame._logError = function(piece, to, e) {
        if (!tck.settings['debug']) {
            return;
        }

        console.log(
            '%s: [%s,%s], e: "%s"',
            piece.id,
            piece.cell,
            (to ? to : '-'),
            e.msg
        );
    };

