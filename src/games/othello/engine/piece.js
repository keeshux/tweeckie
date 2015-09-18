    /* [MODULE]: pieces logic */

    /**
     * @constructor
     */
    function Piece(player, cell) {

        // properties
        this.player = player;
        this.colour = player.colour;
        this.cell = cell; // immutable

        // set on draw()
        this.img = null;
    }

    Piece.DIRECTIONS = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1]
    ];
    Piece.CSS = ['tck-white-piece', 'tck-black-piece'];

    Piece.prototype.namedColour = function() {
        return COLOURS[this.colour];
    };

    Piece.prototype.point = function() {
        return Board.cell2Point(this.cell);
    };

    Piece.prototype.draw = function() {
        this.img = Board.appendPiece(this);
    };

    // change ownership
    Piece.prototype.flip = function() {
        this.player = this.player.opponent;
        this.colour = this.player.colour;
    };

    Piece.prototype.addReachable = function(map) {
        var any = false;
        var point = Board.cell2Point(this.cell); // read-only

        for (var k = 0; k < Piece.DIRECTIONS.length; ++k) {
            var dir = Piece.DIRECTIONS[k];
            var i = point[0] + dir[0];
            var j = point[1] + dir[1];

            if (Board.isInside(i, j)) {
                var next = Board.getBy(i, j);

                // first adjacent cell must be occupied by enemy
                if (next.piece && (next.piece.colour != this.colour)) {
                    var enemies = [];

                    // until last enemy
                    do {
                        enemies.push(next.piece);

                        // go ahead
                        next = null;
                        i += dir[0];
                        j += dir[1];

                        // check boundaries
                        if (Board.isInside(i, j)) {
                            next = Board.getBy(i, j);
                        }
                    } while (next && next.piece &&
                            (next.piece.colour != this.colour));

                    // only reachable if empty after enemy chain
                    //assert(enemies.length > 0);
                    if (next && !next.piece) {

                        // short-circuit method
                        if (map === undefined) {
                            return true;
                        }

                        // add destination with additional information
                        var to = Board.point2Cell(next.point);
                        var item = {
                            by: this,
                            enemies: enemies
                        };
                        if (map[to]) {
                            map[to].push(item);
                        } else {
                            map[to] = [item];
                        }

                        // at least one add
                        any = true;
                    }
                }
            }
        }

        return any;
    };

    // short-circuit
    Piece.prototype.hasReachable = function() {
        return this.addReachable(undefined);
    };

    Piece.prototype.toString = function() {
        return this.cell;
    };

