    /* [MODULE]: player logic */

    var Player = tck.dev.Player;

    /**
     * @constructor
     */
    function CustomPlayer(colour) {

        // properties
        this.colour = colour;
        this.pieces = {}; // varying map
        this.count = 0;   // keeps piece count

        // match state
        this.opponent = null;
        this.turn = (colour == WHITE);

        // reachable map (cell -> {from, enemies})
        this.reachable = null;

        // partial {added, flipped}
        this.steps = [];
    }

    CustomPlayer.prototype = new Player();
    CustomPlayer.prototype.constructor = CustomPlayer;

    CustomPlayer.prototype.namedColour = function() {
        return COLOURS[this.colour];
    };

    CustomPlayer.prototype.arrange = function() {
        var scl = Board.startingCells(this.colour);
        for (var i = 0; i < scl.length; ++i) {
            this._addPiece(scl[i]);
        }

        GUI.onArrange(this);
    };

    CustomPlayer.prototype._addPiece = function(c) {
        var piece = new Piece(this, c);

        // put into piece map
        this.pieces[c] = piece;

        // draw piece and update board matrix
        piece.draw();
        Board.setPiece(piece.cell, piece);

        // update count
        ++this.count;

        return piece;
    };

    // c is always a reachable cell
    CustomPlayer.prototype.add = function(c, onEnd) {
        if (!this.turn) {
            throw new MoveException('not your turn');
        }

        // paths leading to c
        var list = this.reachable[c];
        var allEnemies = [];

        // iterate over all reaching paths
        for (var r = 0; r < list.length; ++r) {
            var item = list[r];

            // flip enemies
            for (var e = 0; e < item.enemies.length; ++e) {
                var enemy = item.enemies[e];
                enemy.flip();

                // change ownership
                this.pieces[enemy.cell] = enemy;
                delete this.opponent.pieces[enemy.cell];

                // update count
                ++this.count;
                --this.opponent.count;
            }

            // update enemies full list
            allEnemies.push.apply(allEnemies, item.enemies);
        }

        // put a new piece into cell
        var newPiece = this._addPiece(c);

        // add new step to step list (keep ref)
        var newStep = {
            added: newPiece,
            flipped: allEnemies
        };
        this.steps.push(newStep);

        // build result
        var result = new MoveResult();
        result.player = this;

        // opponent cannot move: can we move again?
        if (!this.opponent.hasReachable()) {

            // calculate reachable cells
            var anyReachable = this.updateReachable();

            // can move?
            if (anyReachable) {
                result.complete = false;
                result.steps = this.steps[0];
            }

            // NO: match is over
            else {
                result.complete = true;
                result.steps = this.steps;
                result.last = true;
            }
        }

        // opponent can move: pass
        else {
            result.complete = true;
            result.steps = this.steps;

            // reset state
            this.steps = [];
        }

        // flip animation - last step only (async)
        var _this = this;
        this._animateFlip([newStep], function() {
            GUI.onAdd(_this, result);

            // back to caller
            onEnd(result);
        });
    };

    CustomPlayer.prototype.forceAdd = function(result, onEnd) {
        for (var i = 0; i < result.steps.length; ++i) {
            var step = result.steps[i];

            // flip enemies
            for (var e = 0; e < step.flipped.length; ++e) {
                var enemy = step.flipped[e];
                enemy.flip();

                // change ownership
                this.pieces[enemy.cell] = enemy;
                delete this.opponent.pieces[enemy.cell];

                // update count
                ++this.count;
                --this.opponent.count;
            }

            // put added piece into piece map
            this.pieces[step.added.cell] = step.added;

            // draw added piece and update board matrix
            step.added.draw();
            Board.setPiece(step.added.cell, step.added);

            // update count
            ++this.count;
        }

        // flip animation (async)
        var _this = this;
        this._animateFlip(result.steps, function() {
            GUI.onAdd(_this, result);

            // back to caller
            onEnd(result);
        });
    };

    CustomPlayer.prototype._animateFlip = function(steps, onEnd) {

        // new CSS class to assign
        var newClass = ['tck', this.namedColour(), 'piece'].join('-');

        // iterate over steps
        for (var i = 0; i < steps.length; ++i) {
            var list = steps[i].flipped;

            // put marker for later animation
            for (var j = 0; j < list.length; ++j) {
                $(list[j].img).addClass('tck-marked');
            }

            // change colour of marked pieces (TODO: animated)
            var $marked = $('#tck-game-othello .tck-marked');
            //$marked.fadeOut(function() {
                $marked.removeClass();
                $marked.addClass('tck-piece');
                $marked.addClass(newClass);
            //});
            //$marked.fadeIn((function(i) {
            //    return function() {

                    // last step, back to caller
                    if (i == steps.length - 1) {
                        onEnd();
                    }
            //    };
            //})(i));
        }
    };

    CustomPlayer.prototype.updateReachable = function() {
        this.reachable = {};
        var any = false;
        for (var i in this.pieces) {
            var piece = this.pieces[i];
            any |= piece.addReachable(this.reachable);
        }

        // only called if at least one reachable cell
        if (any) {
            GUI.onReachable(this);
        }

        return any;
    };

    // short-circuit
    CustomPlayer.prototype.hasReachable = function() {
        for (var i in this.pieces) {
            var piece = this.pieces[i];
            if (piece && piece.hasReachable()) {
                return true;
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

