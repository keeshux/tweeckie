    /* [MODULE]: board access */

    var SquareBoard = tck.dev.SquareBoard;

    /**
     * @constructor
     */
    function CustomBoard() {

        // (cell id) -> (piece, [i, j])
        this.cells = [];

        // (i, j) -> (cell id)
        this.matrix = new Array(this.size);
        for (var i = 0; i < this.size; ++i) {
            this.matrix[i] = new Array(this.size);
            for (var j = 0; j < this.size; ++j) {
                var c = this.cells.length;
                this.cells[c] = {
                    piece: null,
                    point: [i, j]
                };
                this.matrix[i][j] = c;
            }
        }
    }

    CustomBoard.prototype = new SquareBoard('#tck-game-othello', 8, 50, 20);
    CustomBoard.prototype.constructor = CustomBoard;

    CustomBoard.STARTING_CELLS = [[27, 36], [28, 35]]; // white, black

    // starting cells by colour
    CustomBoard.prototype.startingCells = function(colour) {
        return CustomBoard.STARTING_CELLS[colour];
    };

    CustomBoard.prototype.clear = function() {
        for (var i = 0; i < this.size; ++i) {
            for (var j = 0; j < this.size; ++j) {
                var c = this.matrix[i][j];
                this.cells[c].piece = null;
            }
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
        $img.addClass(Piece.CSS[piece.colour]);

        // set position
        var pos = this.cell2Pos(piece.cell);
        $img.css(pos);

        // save piece ref (for drag and drop)
        $img.data('piece', piece);

        // append DOM
        var $body = $('#tck-game-othello .tck-board-body');
        $body.append(img);

        return img;
    };

    CustomBoard.prototype.getBy = function(i, j) {
        var c = this.matrix[i][j];
        return this.cells[c];
    };

    CustomBoard.prototype.getPiece = function(c) {
        return this.cells[c].piece;
    };

    CustomBoard.prototype.getPieceBy = function(i, j) {
        var c = this.matrix[i][j];
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

    CustomBoard.prototype.coords2Cell = function(i, j) {
        return this.matrix[i][j];
    };

    // especially useful for comparing
    CustomBoard.prototype.serialize = function() {
        var ser = [];
        for (var i = 0; i < this.size; ++i) {
            for (var j = 0; j < this.size; ++j) {
                var c = this.matrix[i][j];
                var p = this.cells[c].piece;
                if (p) {
                    ser.push('WB'.charAt(p.colour));
                } else {
                    ser.push(' ');
                }
            }
        }
        return ser.join('');
    };

    // hardcoded regexp
    CustomBoard.prototype.print = function() {
        var ser = this.serialize();
        var rsep = '+-+-+-+-+-+-+-+-+\n';
        var csep = '|';
        var s = [rsep];
        var rows = ser.match(/([ WB]){8}/g);

        // no need to enforce subsequent matches
        for (var i = 0; i < rows.length; ++i) {
            var row = rows[i];
            s.push(csep);
            s.push(row.replace(/([ \w])/g, '$1' + csep));
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

