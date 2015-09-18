    // [MODULE]: simple objects and exceptions

    // constants
    var WHITE = 0;
    var BLACK = 1;
    var COLOURS = ['white', 'black'];

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
        this.complete = null;   // result is complete
        this.player = null;     // player ref

        // object if incomplete, array if complete
        this.steps = null;
        /*this.steps = {
            added: null,
            flipped: null
        };*/

        this.last = false;      // last move (no more reachable cells)
    }

