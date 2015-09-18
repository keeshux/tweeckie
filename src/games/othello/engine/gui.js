    /* [MODULE]: GUI events */

    // singleton
    var GUI = new function() {
        var _currentGame = null;

        this.initialize = function(game, rotated) {
            _currentGame = game;

            // show the board
            Board.show(rotated);

            // reset DOM
            $('#tck-game-othello .tck-count span').text('2');
            $('#tck-game-othello .tck-reachable').remove();
            $('#tck-game-othello .tck-local .tck-colour').text(_currentGame.local.namedColour());
            $('#tck-game-othello .tck-remote .tck-colour').text(_currentGame.remote.namedColour());

            // starting player
            var starting = _currentGame.getPlayers()[WHITE];
            showNotice(starting.nickname + ' starts');
        };

        // Player: player on board
        this.onArrange = function(player) {
        };

        // Player: reachable map updated
        this.onReachable = function(player) {
            clearReachable();
            appendReachable(player);
        };

        // Player: player added a piece
        this.onAdd = function(player, result) {
            if (result.complete) {
                highlightSteps(result.steps);
            }

            // update count
            $('#tck-game-othello .tck-local .tck-count span').text(_currentGame.local.count);
            $('#tck-game-othello .tck-remote .tck-count span').text(_currentGame.remote.count);
        };

        // Player: turn changed
        this.onPass = function(acquired, released) {
            clearReachable();
            showNotice(acquired.nickname + ' moves');
        };

        // Game: match has a winner
        this.onWin = function(winner, loser) {
            endOfGame();
            showNotice(winner.nickname + ' won!');
        };

        // Game: match ended due to a draw
        this.onDraw = function() {
            endOfGame();
            showNotice('Draw!');
        };

        function showNotice(notice) {

            // external callback
            var onNotice = tck.callbacks['onNotice'];
            onNotice && onNotice(notice);
        }

        function clearReachable() {
            $('#tck-game-othello .tck-reachable').remove();
        }

        function appendReachable(player) {
            var reachable = player.reachable;

            // append clickable cell to board body
            for (var c in reachable) {
                var $reachable = $(document.createElement('div'));
                $reachable.addClass('tck-reachable');

                // position
                var pos = Board.cell2Pos(c);
                $reachable.css(pos);

                // owner and cell (cannot be reached
                // by both players!)
                // NOTE: c is a string key
                $reachable.data('player', player);
                $reachable.data('cell', parseInt(c, 10));

                $('#tck-game-othello .tck-board-body').append($reachable);
            }

            // bind handler
            $('#tck-game-othello .tck-reachable').click(onReachableClick);
        }

        function onReachableClick() {
            var player = $(this).data('player');
            var cell = $(this).data('cell');
            //console.log('player', player.nickname);
            //console.log('cell', cell);

            // start flipping
            _currentGame.move(player, cell);
        }

        function dehighlight() {
            $('#tck-game-othello .tck-highlight').remove();
        }

        function highlightSteps(steps) {
            dehighlight();

            // highlight cell
            for (var i = 0; i < steps.length; ++i) {
                var piece = steps[i].added;
                highlight(piece.cell);
            }
        }

        function highlight(c) {
            var $overlay = $(document.createElement('div'));
            $overlay.addClass('tck-highlight');
            var pos = Board.cell2Pos(c);
            $overlay.css(pos);
            $('#tck-game-othello .tck-board-body').append($overlay);
        }

        function endOfGame() {
            _currentGame.stop();
            clearReachable();
        }
    };

