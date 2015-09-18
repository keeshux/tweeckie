    // [MODULE]: simple objects and exceptions

    // constants
    var WHITE = 0;
    var BLACK = 1;
    var COLOURS = ['white', 'black'];
    var SHORT_COLOURS = ['W', 'B'];

    /**
     * @constructor
     */
    // invalid move
    function MoveException(msg) {
        this.msg = msg;
    }

    /**
     * @constructor
     */
    function MoveResult(complete, piece, path) {

        // mandatory

        this.complete = complete; // result is complete
        this.piece = piece;       // moved piece
        this.path = path;         // origin to destination
        this.won = false;         // winning move

        // optional

        this.captured = null;     // captured pieces
        this.crowned = null;      // cronwed Man
    }

