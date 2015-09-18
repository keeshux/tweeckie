    tck['tests']['chess'] = function(cfg) {
        var cols = null;
        if (cfg['colour'] == WHITE) {
            cols = [WHITE, BLACK];
        } else {
            cols = [BLACK, WHITE];
        }

        var game = new CustomGame(null, cfg);
        game.testing = true;

        game.local = new CustomPlayer(cols[0], cfg['limit']);
        game.local.setTimeoutCallback(function (p) {
            GUI.onTimeout(p);
        });

        game.remote = new CustomPlayer(cols[1], cfg['limit']);
        game.remote.setTimeoutCallback(function (p) {
            GUI.onTimeout(p);
        });

        $('.tck-local-nickname').text('Local');
        $('.tck-remote-nickname').text('Remote');

        // face opponents
        game.local.opponent = game.remote;
        game.remote.opponent = game.local;

        game.start();

        // enable white
        game.getPlayers()[WHITE].enable(true);

        // debugging
        if (tck.settings['debug']) {
            console.log('own colour: %s', COLOURS[game.local.colour]);
        }
        window['local'] = game.local;
        window['remote'] = game.remote;
        window['Board'] = Board;
    };

