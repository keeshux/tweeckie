    /* [MODULE]: player logic */

    var Player = tck.dev.Player;

    /**
     * @constructor
     */
    function CustomPlayer(colour) {

        // properties
        this.colour = colour;
        this.pieces = [];

        // match state
        this.opponent = null;
        this.turn = (colour == BLACK);
        this.enabled = false;

        // capture spanning tree
        this.cptSpan = new Tree();
        this.cptNode = null;       // current node along capture path
        this.cptSelected = null;   // piece currently capturing
        this.cptPath = null;       // partial path
        this.cptCaptured = null;   // partial captured pieces
    }

    CustomPlayer.prototype = new Player();
    CustomPlayer.prototype.constructor = CustomPlayer;

    CustomPlayer.prototype.namedColour = function() {
        return COLOURS[this.colour];
    };

    CustomPlayer.prototype.isWinner = function() {
        return this.opponent.isLoser();
    };

    // no piece left or they cannot move
    CustomPlayer.prototype.isLoser = function() {
        for (var i = 0; i < this.pieces.length; ++i) {
            var p = this.pieces[i];
            if (p.active && p.canMove()) {
                return false;
            }
        }
        return true;
    };

    // TODO: draw
    CustomPlayer.prototype.isDraw = function() {
    };

    CustomPlayer.prototype.arrange = function() {
        var scl = Board.startingCells(this.colour);   // [first, last]

        for (var c = scl[0]; c <= scl[1]; ++c) {
            var piece = new Man(this, c);
            //var piece = (c & 1 ? new Man(this, c) : new King(this,c));

            // assemble a meaningful id ('colour-name[-psfx]')
            var pindex = this.pieces.length;
            var pid = ['checkers', this.namedColour(), piece.name, pindex + 1];
            piece.id = pid.join('-');
            piece.index = pindex;

            // add to player set
            this.pieces.push(piece);

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

    CustomPlayer.prototype.move = function(piece, to) {
        if (to === null) {
            throw new MoveException('invalid cell');
        }
        if (piece.cell == to) {
            throw new MoveException('not moving');
        }
        if (!this.turn) {
            throw new MoveException('not your turn');
        }

        var result = null;

        // if no capture is possible, piece is allowed
        // to move to any adjacent cell
        if (this.cptNode === null) {
            var adjacent = piece.adjacent();
            if ($.inArray(to, adjacent) == -1) {
                throw new MoveException('unreachable cell');
            }

            // valid move (complete)
            result = new MoveResult(true, piece, [piece.cell, to]);

            // update board and graphics
            Board.movePiece(piece, to);
            piece.snap(to, null);
        }

        // otherwise a capture path MUST be followed
        else {
            var first = (this.cptNode === this.cptSpan.root);
            var currentNode = null;

            // first step
            if (first) {
                currentNode = this.cptNode.find(piece.cell);

                // selected piece is not in spanning tree
                if (!currentNode) {
                    throw new MoveException('piece cannot move (other ' +
                            'pieces have priority)');
                }
            }

            // subsequent steps
            else {
                //assert(this.cptSelected !== null);

                // ensure that user keeps moving the same piece
                if (piece !== this.cptSelected) {
                    throw new MoveException('another piece is already moving');
                }

                // restart from current node
                currentNode = this.cptNode;
            }

            // is destination cell reachable?
            //assert(currentNode !== null);
            var nextNode = currentNode.find(to);
            if (!nextNode) {
                throw new MoveException('unreachable cell or low priority path');
            }
            //assert(nextNode.cell == to);

            // NOTE: partial move is legal from here

            // save first touched piece
            if (first) {
                this.cptSelected = piece;
            }

            // captured cell
            var cc = nextNode.captured;

            // update incremental result
            if (!this.cptPath) {
                this.cptPath = [piece.cell];
            }
            if (!this.cptCaptured) {
                this.cptCaptured = [];
            }
            this.cptPath.push(to);
            this.cptCaptured.push(cc);

            // valid move
            var complete = !nextNode.hasChildren();
            result = new MoveResult(complete, piece, this.cptPath);
            result.captured = this.cptCaptured;

            // forget captured piece
            var cpiece = Board.getPiece(cc);
            cpiece.active = false;
            Board.setPiece(cc, null);

            // update board and graphics
            Board.movePiece(piece, to);
            piece.snap(to, cpiece);

            // go ahead if path is not over
            if (!complete) {
                this.cptNode = nextNode;
            }
        }

        //assert(result !== null);

        // complete move
        if (result.complete) {

            // update move count
            ++piece.moves;

            // crowning
            if ((piece instanceof Man) && Board.isBoundary(this.colour, to)) {
                var crPiece = this._crownMan(piece);

                // update result accordingly
                result.piece = crPiece;
                result.crowned = piece;
            }

            // winning move
            result.won = this.opponent.isLoser();
        }

        GUI.onMove(this, result);

        return result;
    };

    // WARNING: no validation
    CustomPlayer.prototype.forceMove = function(result, onEnd) {
        //assert(result.complete);

        // start animation
        var _this = this;
        result.piece.animate(result, function() {

            // forget captured pieces
            if (result.captured) {
                for (var i = 0; i < result.captured.length; ++i) {
                    var cc = result.captured[i];
                    var cpiece = Board.getPiece(cc);
                    cpiece.active = false;
                    Board.setPiece(cc, null);
                }
            }

            // crown piece
            if (result.crowned) {
                var crPiece = _this._crownMan(result.piece);

                // update result accordingly
                result.piece = crPiece;
            }

            // update board
            var path = result.path;
            var to = path[path.length - 1];
            Board.movePiece(result.piece, to);

            GUI.onMove(_this, result);

            // back to caller
            onEnd();
        });
    };

    CustomPlayer.prototype._crownMan = function(piece) {
        var crPiece = piece.crown();

        // update board matrix
        Board.setPiece(piece.cell, crPiece);

        // replace with crowned piece
        piece.active = false;
        this.pieces[piece.index] = crPiece;

        return crPiece;
    };

    // update captures spanning tree (MUST be called upon turn acquisition)
    CustomPlayer.prototype.updateCaptureSpan = function() {

        // clear tree
        this.cptSpan.clear();

        // reset walk
        this.cptNode = null;
        this.cptSelected = null;
        this.cptPath = null;
        this.cptCaptured = null;

        // iterate over jumps (if any)
        var list = this._jumpsList();
        if (list.length > 0) {

            // insert jumps into spanning tree
            for (var i = 0; i < list.length; ++i) {
                this.cptSpan.put(list[i]);
            }

            // pointer to current node (starting from root)
            this.cptNode = this.cptSpan.root;

            if (tck.settings['debug']) {
                console.log('SPAN: dfs =', this.cptSpan.dfs());
            }
        }
    };

    CustomPlayer.prototype._jumpsList = function() {
        var list = [];    // jumps list
        var i = null;     // piece index
        var j = null;     // list index
        var item = null;  // list item
        var k = null;     // path/capture index

        // push every jump into the list saving priority informations
        var maxLength = 0;
        var maxValue = 0;
        var maxCapture = 0;
        var maxOrder = 0;
        for (i = 0; i < this.pieces.length; ++i) {
            var p = this.pieces[i];
            if (p.active) {
                var jumps = p.jumps();

                // inline calculations for filtering
                for (j = 0; j < jumps.length; ++j) {
                    item = jumps[j];

                    // 1) path length
                    if (item.path.length > maxLength) {
                        maxLength = item.path.length;
                    }

                    // 2) capturing piece value
                    if (p.value > maxValue) {
                        maxValue = p.value;
                    }

                    // capture properties
                    var captureValue = 0;
                    var captureOrder = 0;
                    for (k = 0; k < item.capture.length; ++k) {
                        var enemy = Board.getPiece(item.capture[k]);

                        // 3) capture value
                        captureValue += enemy.value;

                        // 4) capture order (kings first)
                        if (enemy instanceof King) {
                            var bit = item.capture.length - k - 1;
                            captureOrder |= (1 << bit);
                        }
                    }
                    if (captureValue > maxCapture) {
                        maxCapture = captureValue;
                    }
                    if (captureOrder > maxOrder) {
                        maxOrder = captureOrder;
                    }

                    // add priority informations to current jump
                    item.priority = [
                        item.path.length,
                        p.value,
                        captureValue,
                        captureOrder
                    ];
                }

                // faster on most browsers (except Chrome)
                list.push.apply(list, jumps);
            }
        }
        if (tck.settings['debug']) {
            console.log('JUMPS:', list);
        }

        // only create filters vector when needed
        if (list.length > 1) {
            if (tck.settings['debug']) {
                console.log('JUMPS: 1) longest path = %d', maxLength);
                console.log('JUMPS: 2) strongest capturing piece value = %d', maxValue);
                console.log('JUMPS: 3) highest capture value = %d', maxCapture);
                console.log('JUMPS: 4) highest capture order = %d', maxOrder);
            }

            // sorted filters
            var filters = [maxLength, maxValue, maxCapture, maxOrder];
            var f = 0;

            // reduce list as much as possible
            while ((list.length > 1) && (f < filters.length)) {
                var max = filters[f];

                // enumerate items with high priority
                // according to current filter
                var filtered = [];
                for (j = 0; j < list.length; ++j) {
                    item = list[j];
                    if (item.priority[f] == max) {
                        filtered.push(item);
                    }
                }

                // retain filtered items
                list = filtered;
                if (tck.settings['debug']) {
                    console.log('JUMPS: filter %d) -', f + 1, list);
                }

                // next filter
                ++f;
            }
        }

        return list;
    };

    // switch turn
    CustomPlayer.prototype.pass = function() {
        this.turn = false;
        this.opponent.turn = true;
        GUI.onPass(this.opponent, this);
    };

