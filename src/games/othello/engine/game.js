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

        this.local = new CustomPlayer(cfg['colour']);//, cfg['limit']);

        /*var _this = this;

        // synchronize own remote counter every 'syncInterval' seconds
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
            //while (_this.localMoving) {}

            //GUI.onTimeout(p);

            // send timeout to remote
            if (!_this.testing) {
                _this.connection.broadcast({
                    'msg': 'timeout'
                });
            }
        });*/

        this.remote = new CustomPlayer(tck.utils.invert(this.local.colour));//, cfg['limit']);

        // face opponents
        this.local.opponent = this.remote;
        this.remote.opponent = this.local;

        this.localMoving = false;
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
            this.local.updateReachable();
            //this.local.startTimer();
        }

        this.state = Game.STARTED;
    };

    CustomGame.prototype['stop'] = function() {
        //this.local.stopTimer();
        //this.remote.stopTimer();

        this.state = Game.ENDED;
    };

    CustomGame.prototype['reset'] = function() {
        //if (this.local) {
        //    //this.local.stopTimer();
        //}
        //if (this.remote) {
        //    //this.remote.stopTimer();
        //}

        // reset variables
        this.state = Game.INIT;
        this.connection = null;
        this.local = null;
        this.remote = null;

        this.localMoving = false;
    };

    CustomGame.prototype['onMessage'] = function(json) {
        var msg = json['msg'];

        // remote player moved a piece
        if (msg == 'move') {
            var result = CustomGame._unpackResult(this.remote, json['result']);
            this.remoteMove(result);
        }
    };

    // local methods

    // GUI: cell clicked locally (local)
    CustomGame.prototype.move = function(player, cell) {
        //assert(player == this.local);

        // game has yet to begin
        if (this.state != Game.STARTED) {
            throw new MoveException('game not started');
        }

        // XXX: mutual exclusion with timeout
        //this.localMoving = true;

        // try choosing
        try {
            var _this = this;
            player.add(cell, function(result) {
                CustomGame._logMove(result);
                if (!result.complete) {
                    return;
                }

                // actions after each move
                _this._afterMove(result);

                // testing: start opponent timer immediately
                if (_this.testing) {
                    if (_this.state != Game.ENDED) {
                        player.opponent.updateReachable();
                        //player.opponent.startTimer();
                    }
                }

                // production: disable player and send move
                //             result across the network
                else {
                    var packedResult = CustomGame._packResult(result);
                    _this.connection.broadcast({
                        'msg': 'move',
                        'result': packedResult
                    });
                }
            });
        } catch (e) {
            if (e instanceof MoveException) {
                CustomGame._logError(player, cell, e);
            }
            throw e;
        } finally {

            // XXX: mutual exclusion with timeout
            //this.localMoving = false;
        }
    };

    // MQ: opponent is ready to move (remote)
    CustomGame.prototype.remoteReady = function() {

        // start opponent timer if match is not over
        //if (this.state == Game.STARTED) {
        //    //this.remote.startTimer();
        //}
    };

    // MQ: piece moved remotely (remote)
    CustomGame.prototype.remoteMove = function(result) {

        // assign directly
        result.player = this.remote;

        // move directly
        var _this = this;
        this.remote.forceAdd(result, function() {

            // actions after each move
            _this._afterMove(result);

            // only update local reachable if still playing
            if (_this.state == Game.STARTED) {
                _this.local.updateReachable();
                //_this.local.startTimer();
            }
        });
    };
/*
    // MQ: synchronization requested (remote)
    CustomGame.prototype.remoteSync = function(remaining) {
        this.remote.remaining = remaining;
        GUI.onCount(this.remote);
    };

    // MQ: remote timed out (remote)
    CustomGame.prototype.remoteTimeout = function() {
        GUI.onTimeout(this.remote);
    };
*/
    // common logic after move() and remoteMove()
    CustomGame.prototype._afterMove = function(result) {
        var me = result.player;
        var opponent = me.opponent;

        // match over?
        if (result.last) {

            // end for victory
            if (me.count > opponent.count) {
                GUI.onWin(me, opponent);
            } else if (me.count < opponent.count) {
                GUI.onWin(opponent, me);
            }

            // end for draw
            else {
                GUI.onDraw();
            }
        } else {

            // opponent's turn
            me.pass();

            // only recalculate reachable cells on local player or in testing
            // (calculations are heavy and opponent does them already)
            if ((opponent === this.local) || this.testing) {
                opponent.updateReachable();
            }
        }
    };

    // MoveResult -> string
    CustomGame._packResult = function(m) {
        var obj = {};

        // steps = pieces -> items = cells
        var items = new Array(m.steps.length);
        for (var i = 0; i < items.length; ++i) {
            var step = m.steps[i];

            // added cell
            var added = step.added.cell;

            // flipped cells
            var flipped = new Array(step.flipped.length);
            for (var j = 0; j < flipped.length; ++j) {
                flipped[j] = step.flipped[j].cell;
            }

            // put item
            items[i] = {
                'added': added,
                'flipped': flipped
            };
        }
        obj['items'] = items;
        obj['last'] = m.last;

        if (tck.settings['debug']) {
            console.log('packResult:', m, obj);
        }
        return obj;
    };

    // string -> MoveResult
    CustomGame._unpackResult = function(player, json) {
        var m = new MoveResult();
        m.complete = true;

        // items = cells -> steps = pieces (create added)
        var items = json['items'];
        m.steps = new Array(items.length);
        for (var i = 0; i < items.length; ++i) {
            var step = {};
            var item = items[i];

            // added piece
            var added = item['added'];
            step.added = new Piece(player, added);

            // flipped pieces
            var flipped = item['flipped'];
            step.flipped = new Array(flipped.length);
            for (var j = 0; j < flipped.length; ++j) {
                step.flipped[j] = Board.getPiece(flipped[j]);
            }

            // put step
            m.steps[i] = step;
        }

        // last flag
        m.last = json['last'];

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

        var player = result.player;

        // extensive move description
        console.log('%s result: ', player.namedColour(), result);
        for (var i = 0; i < result.steps.length; ++i) {
            var step = result.steps[i];
            console.log(
                '%s: added: [%s], flipped: [%s]',
                player.namedColour(),
                step.added.cell,
                step.flipped.join(',')
            );
        }
        console.log(
            '%s: complete: %s, last: %s',
            player.namedColour(),
            result.complete,
            result.last
        );
    };

    CustomGame._logError = function(player, c, e) {
        if (!tck.settings['debug']) {
            return;
        }

        console.log(
            '%s: %s, e: "%s"',
            player.namedColour(),
            c,
            e.msg
        );
    };

