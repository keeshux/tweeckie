/**
 * @constructor
 */
// HTML target, size in cells, edge in pixels
function SquareBoard(target, size, edge, edgeSm) {
    this.target = target;
    this.size = size;

    // CSS parameters (pixels)
    this.edge = edge;
    this.edgeSm = edgeSm;

    // public
    this.rotated = false;

    $(target).addClass('tck-board');
}

SquareBoard.prototype.toRow = function(i) {
    return i + 1;
};

SquareBoard.prototype.toColumn = function(j) {
    return String.fromCharCode(0x61 + j);
};

SquareBoard.prototype.isInside = function(i, j) {
    return (i >= 0) && (i < this.size) &&
            (j >= 0) && (j < this.size);
};

// reset and show
SquareBoard.prototype.show = function(rotated) {
    this.clear();
    this.rotated = rotated;
    this.draw();
};

// empty associated data
SquareBoard.prototype.clear = function() {
    //throw 'not implemented';
};

SquareBoard.prototype.draw = function() {

    // look for existing HTML board
    var $target = $(this.target);
    var $wrapper = $target.find('.tck-board-content');
    var $body = $target.find('.tck-board-body');
    var i = null;

    // first call
    if ($body.length === 0) {

        // create rows (left and right)
        var $leftRows = $(document.createElement('ul'));
        $leftRows.addClass('tck-board-rows');
        $leftRows.css('float', 'left');
        for (i = 0; i < this.size; ++i) {
            var $r = $(document.createElement('li'));
            $leftRows.append($r);
        }
        var $rightRows = $leftRows.clone().css('float', 'right');

        // create columns
        var $columns = $(document.createElement('ul'));
        $columns.addClass('tck-board-columns');
        for (i = 0; i < this.size; ++i) {
            var $c = $(document.createElement('li'));
            $columns.append($c);
        }

        // create body
        $body = $(document.createElement('div'));
        $body.addClass('tck-board-body');

        // DOM creation
        $wrapper.append($columns);
        $wrapper.append($leftRows);
        $wrapper.append($rightRows);
        $wrapper.append($body);
        $wrapper.append($columns.clone());
    }

    // redraw
    else {
        $body.empty();
    }

    // update indices
    var _this = this;
    $wrapper.find('.tck-board-rows li').each(function(i, li) {
        var ri = i % _this.size;
        if (_this.rotated) {
            ri = _this.size - ri - 1;
        }
        var y = _this.toRow(ri);
        $(li).text(y);
    });
    $wrapper.find('.tck-board-columns li').each(function(j, li) {
        var rj = j % _this.size;
        if (_this.rotated) {
            rj = _this.size - rj - 1;
        }
        var x = _this.toColumn(rj);
        $(li).text(x);
    });
};

// compute board coordinates from absolute position {top, left}
SquareBoard.prototype.pos2Coords = function(pos) {
    var halfEdge = this.edge >> 1;

    // y overflow
    var yof = pos.top % this.edge;
    var i = (pos.top - yof) / this.edge;
    if (yof > halfEdge) {
        ++i;
    }

    // x overflow
    var xof = pos.left % this.edge;
    var j = (pos.left - xof) / this.edge;
    if (xof > halfEdge) {
        ++j;
    }

    if (this.rotated) {
        i = this.size - 1 - i;
        j = this.size - 1 - j;
    }
    return [i, j];
};

// compute absolute position {top, left} from board coordinates
SquareBoard.prototype.coords2Pos = function(point) {
    var y = point[0];
    var x = point[1];
    if (this.rotated) {
        y = this.size - point[0] - 1;
        x = this.size - point[1] - 1;
    }
    return {
        top: y * this.edge,
        left: x * this.edge
    };
};

// for comparing
SquareBoard.prototype.serialize = function() {
    throw 'not implemented';
};

SquareBoard.prototype.print = function() {
    throw 'not implemented';
};

