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
    function MoveResult() {

        // move

        this.piece = null;          // moved piece
        this.details = null;
        /*this.details = {
            from: null,             // origin
            to: null,               // destination
            epEntered: false,       // entering en-passant state
            captured: null,         // captured piece
            epCaptured: false,      // piece captured en-passant
            castling: null,         // 1 = short, 2 = long
            rook: null,             // castled rook
            rookFrom: null,         // castled rook origin
            rookTo: null,           // castled rook destination
            promoted: false         // pawn was promoted
        };*/

        // post-move

        this.disambiguation = null; // disambiguation string for notation
        this.prCode = null;         // promoted piece code
        this.prPiece = null;        // promoted piece (still null if remote)
        this.oppoState = null;      // opponent state (set by CustomPlayer)

        // optional

        this.remaining = null;      // remaining time (set by CustomPlayer)
    }

