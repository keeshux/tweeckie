    tck['tests']['checkers'] = function(cfg) {
        var cols = null;
        if (cfg['colour'] == WHITE) {
            cols = [WHITE, BLACK];
        } else {
            cols = [BLACK, WHITE];
        }

        var game = new CustomGame(null, cfg);
        game.testing = true;

        // players
        game.local = new CustomPlayer(cols[0]);
        game.remote = new CustomPlayer(cols[1]);

        $('.tck-local-nickname').text('Local');
        $('.tck-remote-nickname').text('Remote');

        // face opponents
        game.local.opponent = game.remote;
        game.remote.opponent = game.local;

        game.start();

        // enable black
        game.getPlayers()[BLACK].enable(true);

        // debugging
        if (tck.settings['debug']) {
            console.log('own colour: %s', COLOURS[game.local.colour]);
        }
        window['local'] = game.local;
        window['remote'] = game.remote;
        window['Board'] = Board;
    };

