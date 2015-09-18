    /* [MODULE]: GUI events */

    // singleton
    var GUI = new function() {
        var _currentGame = null;
        var _bound = false;

        this.initialize = function(game, rotated) {
            _currentGame = game;

            // show the board
            Board.show(rotated);

            $('#tck-game-checkers .tck-local .tck-colour').text(_currentGame.local.namedColour());
            $('#tck-game-checkers .tck-remote .tck-colour').text(_currentGame.remote.namedColour());

            // attach handlers (only once)
            if (!_bound) {

                // droppable board
                $('#tck-game-checkers .tck-board-body').droppable({
                    'accept': '.tck-piece',
                    'drop': function(ev, ui) {
                        var $img = ui.draggable;
                        var piece = $img.data('piece');
                        var to = Board.pos2Cell($img.position());

                        // move own piece, on error revert position
                        try {
                            _currentGame.move(piece, to);
                        } catch (e) {
                            var fromPos = Board.cell2Pos(piece.cell);
                            $img.animate(fromPos);

                            // log exception
                            if (tck.settings['debug']) {
                                console.error('exception:', e);
                            }
                        }
                    }
                });

                _bound = true;
            }

            // starting player
            var starting = _currentGame.getPlayers()[BLACK];
            showNotice(starting.nickname + ' starts');
        };

        // Player: player on board
        this.onArrange = function(player) {
        };

        // Player: player moved a piece
        this.onMove = function(player, result) {

            // complete result: highlight path
            if (result.complete) {
                highlightCells(result.path, undefined);
            }

            // partial result
            else {

                // first step, highlight path
                if (result.path.length == 2) {
                    highlightCells(result.path, undefined);
                }

                // subsequent step, highlight last and keep previous
                else {
                    var last = result.path[result.path.length - 1];
                    highlightCells([last], true);
                }
            }
        };

        // Piece: (async) a piece was captured
        this.onCapture = function(captured) {
        };

        // Player: turn changed
        this.onPass = function(acquired, released) {
            showNotice(acquired.nickname + ' moves');
        };

        // Game: match has a winner
        this.onWin = function(winner, loser) {
            _currentGame.stop();
            showNotice(winner.nickname + ' won!');
        };

        // Game: match ended due to a draw
        this.onDraw = function(state) {
            _currentGame.stop();
            showNotice('Draw!');
        };

        function showNotice(notice) {

            // external callback
            var onNotice = tck.callbacks['onNotice'];
            onNotice && onNotice(notice);
        }

        function highlightCells(cells, keepPrevious) {

            // de-highlight previously highlighted cells
            if (!keepPrevious) {
                $('#tck-game-checkers .tck-highlight').remove();
            }

            // highlight cells
            for (var i = 0; i < cells.length; ++i) {
                highlight(cells[i]);
            }
        }

        function highlight(c) {
            var $overlay = $(document.createElement('div'));
            $overlay.addClass('tck-highlight');
            var pos = Board.cell2Pos(c);
            $overlay.css(pos);
            $('#tck-game-checkers .tck-board-body').append($overlay);
        }
    };

