    /* [MODULE]: board access */

    var SquareBoard = tck.dev.SquareBoard;

    /**
     * @constructor
     */
    function CustomBoard() {
        var c = 1;

        // (cell id) -> (piece, [i, j])
        this.cells = new Array(this.size * this.size / 2 + 1); // 1-based

        // (i, j) -> (cell id)
        this.matrix = new Array(this.size);
        for (var i = 0; i < this.size; ++i) {
            this.matrix[i] = new Array(this.size);
            for (var j = 0; j < this.size; ++j) {

                // half cells
                if ((i + j) & 1) {
                    this.matrix[i][j] = null;
                } else {
                    this.cells[c] = {
                        cell: c,
                        piece: null,
                        point: [i, j]
                    };
                    this.matrix[i][j] = c;
                    ++c;
                }
            }
        }
    }

    CustomBoard.prototype = new SquareBoard('#tck-game-checkers', 8, 50, 20);
    CustomBoard.prototype.constructor = CustomBoard;

    CustomBoard.STARTING_CELLS = [[21, 32], [1, 12]]; // white, black

    // starting cells by colour
    CustomBoard.prototype.startingCells = function(colour) {
        return CustomBoard.STARTING_CELLS[colour];
    };

    CustomBoard.prototype.isBoundary = function(colour, c) {
        return (colour == WHITE) ? this.isTop(c) : this.isBottom(c);
    };

    CustomBoard.prototype.isTop = function(c) {
        return (c >= 1) && (c <= 4);
    };

    CustomBoard.prototype.isRight = function(c) {
        return !(c % this.size);
    };

    CustomBoard.prototype.isBottom = function(c) {
        return (c >= 29) && (c <= 32);
    };

    CustomBoard.prototype.isLeft = function(c) {
        return !((c - 1) % this.size);
    };

    CustomBoard.prototype.clear = function() {
        for (var c = 1; c < this.cells.length; ++c) {
            this.cells[c].piece = null;
        }
    };

    CustomBoard.prototype.pos2Cell = function(pos) {
        var point = this.pos2Coords(pos);
        return this.point2Cell(point);
    };

    CustomBoard.prototype.cell2Pos = function(c) {
        var point = this.cell2Point(c);
        return this.coords2Pos(point);
    };

    CustomBoard.prototype.appendPiece = function(piece) {
        var img = document.createElement('div');
        var $img = $(img);

        $img.attr('id', piece.id);
        $img.addClass('tck-piece');  
        $img.addClass(piece.cssClass);

        // z-index
        var zNormal = '5';
        var zTop = '10';

        // set position
        var pos = this.cell2Pos(piece.cell);
        $img.css(pos);
        $img.css('z-index', zNormal);

        // save piece ref (for drag and drop)
        $img.data('piece', piece);

        // append DOM
        var $body = $('#tck-game-checkers .tck-board-body');
        $body.append(img);

        // make draggable but initially disabled
        $img.draggable({
            'containment': '#tck-game-checkers .tck-board-body',
            'disabled': true,

            // keep on top while dragging
            'start': function() {
                $(this).css('z-index', zTop);
            },
            'stop': function() {
                $(this).css('z-index', zNormal);
            }
        });

        return img;
    };

    // WARNING: side-effect
    CustomBoard.prototype.movePiece = function(piece, to) {
        this.setPiece(piece.cell, null);
        this.setPiece(to, piece);
        piece.cell = to;
    };

    CustomBoard.prototype.getBy = function(i, j) {
        var c = this.matrix[i][j];
        return this.cells[c];
    };

    CustomBoard.prototype.getPiece = function(c) {
        return this.cells[c].piece;
    };

    CustomBoard.prototype.setPiece = function(c, piece) {
        this.cells[c].piece = piece;
    };

    CustomBoard.prototype.cell2Point = function(c) {
        return this.cells[c].point;
    };

    CustomBoard.prototype.point2Cell = function(point) {
        return this.matrix[point[0]][point[1]];
    };

    // especially useful for comparing
    CustomBoard.prototype.serialize = function() {
        var ser = [];
        for (var c = 1; c < this.cells.length; ++c) {
            var p = this.cells[c].piece;
            if (p) {
                ser.push(p.toTypeString());
            } else {
                ser.push('  ');
            }
        }
        return ser.join('');
    };

    // hardcoded regexp
    CustomBoard.prototype.print = function() {
        var ser = this.serialize();
        var rsep = '+--+--+--+--+--+--+--+--+\n';
        var csep = '|';
        var s = [rsep];
        var rows = ser.match(/(  |[WB][MK]){4}/g);

        // no need to enforce subsequent matches
        for (var i = 0; i < rows.length; ++i) {
            var row = rows[i];
            s.push(csep);
            var subst = null;
            if (i & 1) {
                subst = ['  ', csep, '$1', csep];
            } else {
                subst = ['$1', csep, '  ', csep];
            }
            s.push(row.replace(/([ \w]{2})/g, subst.join('')));
            s.push('\n');
            s.push(rsep);
        }
        var printable = s.join('');
        if (this.rotated) {
            printable = tck.utils.reverseString(printable);
            printable = printable.replace(/(\w)(\w)/g, '$2$1');
        }
        console.log(printable);
    };

    var Board = new CustomBoard();

