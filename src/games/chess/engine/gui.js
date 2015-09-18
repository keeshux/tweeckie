    /* [MODULE]: GUI events */

    // singleton
    var GUI = new function() {
        var _currentGame = null;
        var _bound = false;
        var _acnIndex = 1;
        var _promotionClasses = [Queen, Rook, Knight, Bishop];

        this.initialize = function(game, rotated) {
            _currentGame = game;

            // show the board
            Board.show(rotated);

            // reset DOM
            _acnIndex = 1;
            $('#tck-game-chess .tck-promotion').empty();
            $('#tck-game-chess .tck-captured').empty();
            $('#tck-game-chess .tck-history').empty();
            $('#tck-game-chess .tck-local .tck-colour').text(_currentGame.local.namedColour());
            $('#tck-game-chess .tck-remote .tck-colour').text(_currentGame.remote.namedColour());

            // attach handlers (only once)
            if (!_bound) {

                // droppable board
                $('#tck-game-chess .tck-board-body').droppable({
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

                // also fill promotion items
                fillPromotion();

                _bound = true;
            }

            // starting player
            var starting = _currentGame.getPlayers()[WHITE];
            showNotice(starting.nickname + ' starts');
        };

        // Player: player on board
        this.onArrange = function(player) {
            var whois = _currentGame.whois(player);
            var areaSel = '#tck-game-chess .tck-' + whois;
            var timeSel = areaSel + ' .tck-time';
            if (player.remaining) {
                $(timeSel).text(tck.utils.readableTime(player.remaining));
            } else {
                $(timeSel).text('no limit');
            }
        };

        // Player: (async) pawn promotion
        this.onPromotion = function(player, restartFlow) {
            var $chooser = $('#tck-game-chess .tck-promotion');

            // save parameters for flow restart
            $chooser.data('restartFlow', restartFlow);
            $chooser.data('player', player);

            // update items style with player colour
            setPromotionColour(player.namedColour());

            // disable player and show chooser
            player.enable(false);
            $chooser.show();
        };

        // Player: player moved a piece
        this.onMove = function(player, result) {

            // append ACN fragment to history box
            appendHistoryMove(result);

            // highlight result on the board
            highlightResult(result);
        };

        // Piece: (async) a piece was captured
        this.onCapture = function(captured) {
            var whois = _currentGame.whois(captured.player.opponent);
            var cptSel = '#tck-game-chess .tck-' + whois + ' .tck-captured';

            // remove piece
            $(captured.img).remove();

            // recreate small piece in captured box
            var $img = $(document.createElement('li'));
            $img.addClass('tck-piece-sm');
            $img.addClass(captured.cssClassSm);
            $(cptSel).append($img);
        };

        // Player: turn changed
        this.onPass = function(acquired, released) {
            if (acquired.state == CustomPlayer.CHECK) {
                showNotice(acquired.nickname + ' is in check!');
            } else {
                showNotice(acquired.nickname + ' moves');
            }
        };

        // Player/Game: count changed
        this.onCount = function(player) {
            var whois = _currentGame.whois(player);
            var timeSel = '#tck-game-chess .tck-' + whois + ' .tck-time';
            $(timeSel).text(tck.utils.readableTime(player.remaining));
        };

        // Game: time is over
        this.onTimeout = function(player) {
            showNotice(player.nickname + ' won on time!');
            endOfGame();
        };

        // Game: match has a winner (checkmate)
        this.onWin = function(winner, loser) {
            endOfGame();
            showNotice(winner.nickname + ' won!');
        };

        // Game: match ended due to a draw (stalemate or agreed)
        this.onDraw = function(state) {
            endOfGame();
            showNotice('Draw!');
        };

        function showNotice(notice) {

            // external callback
            var onNotice = tck.callbacks['onNotice'];
            onNotice && onNotice(notice);
        }

        function appendHistoryMove(result) {
            var piece = result.piece;

            // compute algebraic chess notation
            var frag = [];
            var acn = toACN(result);

            // white prepends counter and increases it
            if (piece.colour == WHITE) {
                frag.push(_acnIndex);
                frag.push(': ');
                frag.push(acn);
                ++_acnIndex;
            }

            // black starts a new line
            else {
                frag.push(' ');
                frag.push(acn);
                frag.push('<br />');
            }

            appendHistory(frag.join(''));
        }

        function appendHistoryEnd() {
            var players = _currentGame.getPlayers();
            var frag = [];

            // prepend adequate new lines
            if (_acnIndex > 1) {
                frag.push('<br />');
            }
            if (players[BLACK].turn) {
                frag.push('<br />');
            }

            // compute state of each player
            var values = new Array(players.length);
            for (var i = 0; i < players.length; ++i) {
                if (players[i].isWinner()) {
                    values[i] = '1';
                } else if (players[i].isLoser()) {
                    values[i] = '0';
                } else {
                    values[i] = '1/2';
                }
            }
            frag.push(values.join('-'));

            appendHistory(frag.join(''));
        }

        function appendHistory(frag) {
            var $history = $('#tck-game-chess .tck-history');
            $history.append(frag);
            $history.scrollTop($history.get(0).scrollHeight);
        }

        function fillPromotion() {
            var $chooser = $('#tck-game-chess .tck-promotion');

            // clickable promotions
            for (var i = 0; i < _promotionClasses.length; ++i) {
                var $choice = $(document.createElement('li'));

                // required by click handler
                $choice.data('code', _promotionClasses[i].CODE);
                $choice.data('name', _promotionClasses[i].NAME);

                // append promotion choice
                $chooser.append($choice);
            }

            // handler for just created items
            $chooser.children().click(function() {
                var restartFlow = $chooser.data('restartFlow');
                var player = $chooser.data('player');

                // restart flow after promotion choice
                if (restartFlow && player) {

                    // send choice back to caller
                    var code = $(this).data('code');
                    restartFlow(code);

                    // hide chooser and re-enable player
                    $chooser.hide();
                    player.enable(true);

                    // invalidate parameters
                    $chooser.removeData('restartFlow');
                    $chooser.removeData('player');
                }
            });
        }

        function setPromotionColour(namedColour) {
            var $chooser = $('#tck-game-chess .tck-promotion');

            // update items colour
            $chooser.children().each(function() {

                // specific piece CSS class
                var pieceCssClass = [
                    'tck',
                    namedColour,
                    $(this).data('name')
                ].join('-');

                $(this).removeClass();
                $(this).addClass('tck-piece');
                $(this).addClass(pieceCssClass);
            });
        }

        function highlightResult(result) {

            // de-highlight previously highlighted cells
            $('#tck-game-chess .tck-highlight').remove();

            // highlight own cells
            var details = result.details;
            highlight(details.from);
            highlight(details.to);
            if (details.castling) {
                highlight(details.rookFrom);
                highlight(details.rookTo);
            }
        }

        function highlight(c) {
            var $overlay = $(document.createElement('div'));
            $overlay.addClass('tck-highlight');
            var pos = Board.cell2Pos(c);
            $overlay.css(pos);
            $('#tck-game-chess .tck-board-body').append($overlay);
        }

        function endOfGame() {
            _currentGame.stop();
            appendHistoryEnd();
        }

        // algebraic chess notation
        function toACN(result) {
            var piece = result.piece;
            var details = result.details;
            var acn = [];

            // castling is an immediate case
            if (details.castling == King.SHORT_CASTLING) {
                acn.push('0-0');
            } else if (details.castling == King.LONG_CASTLING) {
                acn.push('0-0-0');
            }

            // dynamic scenarios
            else {

                // piece code (not pawns)
                if (!(piece instanceof Pawn)) {
                    acn.push(piece.code);
                }

                // disambiguation
                if (result.disambiguation) {
                    acn.push(result.disambiguation);
                }

                // capture
                if (details.captured) {

                    // pawns add departure file
                    if (piece instanceof Pawn) {
                        acn.push(details.from.charAt(0));
                    }
                    acn.push('x');
                }

                // destination
                acn.push(details.to);

                // promotion
                if (details.promoted) {
                    //acn.push('='); // non-standard
                    acn.push(result.prCode);
                }

                // check and checkmate
                if (result.oppoState == CustomPlayer.CHECK) {
                    acn.push('+');
                } else if (result.oppoState == CustomPlayer.CHECKMATE) {
                    acn.push('#');
                }

                // capture was en-passant
                if (details.epCaptured) {
                    acn.push('(ep)');
                }
            }

            return acn.join('');
        }
    };

