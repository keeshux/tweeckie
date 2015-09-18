// [GLOBAL]: global symbols

// framework settings
var settings = {
    debug: false,
    nickname: null,
    channel: null,
    idChars: '0123456789',
    channelLen: 16,
    suffixLen: 12,
    disconnectOnQuit: false,
    mq: {
        debug: false,
        pubUrl: '/mq/send?id=$1',
        subUrl: '/mq/recv?id=$1',
        sendTimeout: 8000,
        sendRetry: 2000,
        pollTimeout: 60000,
        pollDelay: 100,
        pollRetry: 3000
    },
    games: {
        root: '/tweeckie/games',
        htmlFile: 'layout.html',
        cssFile: 'style.css',
        jsFile: 'engine.js'
    },
    syncInterval: 30000
};

// framework callbacks
var callbacks = {
    onGameLoad: function(name) {},
    onCreate: function(channel, cfg) {},
    onAccept: function(me, opponent, cfg) {},
    onRefuse: function(reason) {},
    onNotice: function(notice) {},
    onChat: function(opponent, message) {},
    onQuit: function(opponent) {},
    onDisconnect: function(wasConnected) {},
    onRawMessage: function(json) {}
};

// client API
var api = (function() {

    // symbolic constants
    var CREATOR = 10;
    var OPPONENT = 20;

    // CREATOR or OPPONENT
    var _whoami = null;

    // connection state
    var _connection = null;
    var _ownNickname = null;
    var _remoteNickname = null;

    // active game
    var _gameCfg = null;
    var _currentGame = null;

    // shared logic by creator and opponent
    function executeSharedDispatchers(json) {
        var msg = json.msg;

        // counterpart quit
        if (msg == 'quit') {
            var savedRemoteNickname = _remoteNickname;

            // tell remote side to clean up
             _connection.send({
                msg: 'bye'
            });

            // external callback
            var onQuit = callbacks.onQuit;
            onQuit && onQuit(savedRemoteNickname);

            // creator may not disconnect
            var disconnect = ((_whoami != CREATOR) || settings.disconnectOnQuit);
            cleanUp(disconnect, true);
        }

        // couterpart acknowledged our quit
        else if (msg == 'bye') {
            cleanUp(true, true);
        }

        // chat message received
        else if (msg == 'chat') {
            var nickname = json.nickname;
            var message = json.what;

            // external callback
            var onChat = callbacks.onChat;
            onChat && onChat(nickname, message);
        }

        // raw message
        else if (msg == 'raw') {

            // external callback
            var onRawMessage = callbacks.onRawMessage;
            onRawMessage && onRawMessage(json);
        }

        // also forward to active game
        if (_currentGame) {
            _currentGame.onMessage(json);
        }
    }

    // start game with current configuration
    function startGame() {
        if (!_connection) {
            return;
        }
        if (_currentGame) {
            _currentGame.reset();
        }
        _currentGame = newGame(_connection, _gameCfg);
        _currentGame.start();
    };

    // game factory
    function newGame(connection, cfg) {
        var gameName = cfg.game;
        var module = GameModule.getRegisteredModule(gameName);
        var GameClass = module.clazz;
        if (!GameClass) {
            throw 'unknown game: ' + gameName;
        }

        // set nicknames after creation
        var game = new GameClass(connection, cfg);
        game.local.nickname = _ownNickname;
        game.remote.nickname = _remoteNickname;
        return game;
    };

    function setMarkupNicknames() {
        $('.tck-local-nickname').text(_ownNickname);
        $('.tck-remote-nickname').text(_remoteNickname);
    }

    function sendQuitMessage() {
        if (!_remoteNickname) {
            return false;
        }

        _connection.send({
            msg: 'quit'
        });
        return true;
    }

    // stop game and disconnect
    function cleanUp(disconnect, wasConnected) {
        if (_currentGame) {
            _currentGame.reset();
            _currentGame = null;
        }
        _remoteNickname = null;
        if (disconnect && _connection) {
            _connection.disconnect();
            _connection = null;

            // external callback
            if (disconnect) {
                var onDisconnect = callbacks.onDisconnect;
                onDisconnect && onDisconnect(wasConnected);
            }
        }
    }

    return {

        // load game module
        loadGame: function(gameName, target) {
            var module = new GameModule(gameName);
            module.load(target);
            return module;
        },

        // unload game module
        unloadGame: function(gameName) {
            var module = GameModule.getRegisteredModule(gameName);
            if (module) {
                module.unload();
            }
        },

        // names of registered game modules
        registeredGames: function() {
            return GameModule.getRegisteredModuleNames();
        },

        // creator connection
        create: function(cfg, channel) {
            if (!settings.nickname) {
                throw 'settings.nickname not set';
            }

            _whoami = CREATOR;
            _ownNickname = settings.nickname;
            _gameCfg = cfg;

            // parameter, settings, random
            if (!channel) {
                channel = settings.channel;
            }
            if (!channel) {
                channel = utils.randomString(settings.idChars,
                        settings.channelLen);
            }

            // receive on channel
            // will send to opponent queue (set on join)
            _connection = new Connection();
            _connection.localQ = channel;
            _connection.remoteQ = null;

            // creator connection
            _connection.connect(

                // onConnect
                function(channel) {

                    // external callback
                    var onCreate = callbacks.onCreate;
                    onCreate && onCreate(channel, _gameCfg);
                },

                // onPublish
                function(channel, data) {

                    // XXX: Safari receives empty data on subscribe
                    if (!data) {
                        return;
                    }

                    var json = JSON.parse(data);
                    var recipient = json.recipient;
                    var msg = json.msg;

                    // refuse messages without recipient
                    if (!recipient) {
                        if (settings.debug) {
                            console.error('json without recipient');
                        }
                        return;
                    }

                    // refuse if session is taken
                    if (_connection.remoteQ &&
                            (recipient != _connection.remoteQ)) {

                        _connection._rawSend(recipient, {
                            msg: 'refuse',
                            reason: 'Session busy!'
                        });
                        return;
                    }

                    // handshake, request identification
                    if (msg == 'hello') {
                        _connection._rawSend(recipient, {
                            msg: 'identify'
                        });
                    }

                    // client is asking to join the session
                    else if (msg == 'join') {
                        var clientNickname = json.nickname;

                        // an opponent already joined
                        if (_connection.remoteQ) {
                            _connection._rawSend(recipient, {
                                msg: 'refuse',
                                reason: 'You joined already!'
                            });
                            return;
                        }

                        // nick collision
                        if (clientNickname == _ownNickname) {
                            _connection._rawSend(recipient, {
                                msg: 'refuse',
                                reason: 'Nick collision, choose a different nickname!'
                            });
                            return;
                        }

                        // recognize opponent as the remote counterpart
                        _connection.remoteQ = recipient;
                        _remoteNickname = clientNickname;

                        // send accept message with own nickname and game data
                        _connection.send({
                            msg: 'accept',
                            nickname: _ownNickname,
                            cfg: _gameCfg
                        });

                        // set nicknames in games markup
                        setMarkupNicknames();

                        // external callback
                        var onAccept = callbacks.onAccept;
                        onAccept && onAccept(_ownNickname, _remoteNickname, _gameCfg);

                        // start game
                        startGame();
                    }

                    // execute shared dispatchers
                    executeSharedDispatchers(json);
                }
            );
        },

        // opponent connection (on invitation)
        join: function(channel, ownSuffix) {
            if (!settings.nickname) {
                throw 'settings.nickname not set';
            }

            _whoami = OPPONENT;
            _ownNickname = settings.nickname;

            // parameter, settings, exception
            if (!channel) {
                channel = settings.channel;
            }
            if (!channel) {
                throw 'channel and settings.channel not set';
            }

            // close previous connection if new session
            if (_connection && (channel != _connection.remoteQ)) {
                sendQuitMessage();
                cleanUp(true, true);
            }

            // new connection
            if (!_connection) {

                // receive on suffixed queue (defaults to random)
                // send to creator channel
                _connection = new Connection();
                if (!ownSuffix) {
                    ownSuffix = utils.randomString(settings.idChars,
                            settings.suffixLen);
                }
                _connection.localQ = [channel, '/', ownSuffix].join('');
                _connection.remoteQ = channel;

                // opponent connection
                _connection.connect(

                    // onConnect
                    function(channel) {
                    },

                    // onPublish
                    function(channel, data) {

                        // XXX: Safari receives empty data on subscribe
                        if (!data) {
                            return;
                        }

                        var json = JSON.parse(data);
                        var recipient = json.recipient;
                        var msg = json.msg;

                        // ignore spoofed messages
                        if (_connection.remoteQ &&
                                (recipient != _connection.remoteQ)) {

                            return;
                        }

                        // creator requested identification
                        if (msg == 'identify') {
                            _connection.send({
                                msg: 'join',
                                nickname: _ownNickname
                            });
                        }

                        // creator accepted join request
                        else if (msg == 'accept') {

                            // recognize creator as the remote counterpart
                            _remoteNickname = json.nickname;

                            // import game configuration data (set invited flag)
                            _gameCfg = json.cfg;
                            _gameCfg.invited = true;

                            // set nicknames in games markup
                            setMarkupNicknames();

                            // external callback
                            var onAccept = callbacks.onAccept;
                            onAccept && onAccept(_ownNickname, _remoteNickname, _gameCfg);

                            // start game
                            startGame();
                        }

                        // creator refused join request
                        else if (msg == 'refuse') {

                            // external callback
                            var reason = json.reason;
                            var onRefuse = callbacks.onRefuse;
                            onRefuse && onRefuse(reason);
                        }

                        // execute shared dispatchers
                        executeSharedDispatchers(json);
                    }
                );
            }

            // start handshake
            _connection.send({
                msg: 'hello'
            });
        },

        channel: function() {
            return _connection.localQ;
        },

        sessionStarted: function() {
            return (_remoteNickname !== null);
        },

        isCreator: function() {
            return (_whoami == CREATOR);
        },

        isOpponent: function() {
            return (_whoami == OPPONENT);
        },

        ownNickname: function() {
            return _ownNickname;
        },

        remoteNickname: function() {
            return _remoteNickname;
        },

        // send chat message
        say: function(what) {
            if (!_connection) {
                return null;
            }
            _connection.send({
                msg: 'chat',
                nickname: _ownNickname,
                what: what
            });
            return _ownNickname;
        },

        // send raw JSON message
        sendRaw: function(json) {
            if (!_connection) {
                return false;
            }

            // mark as raw message to avoid hijacking
            json.msg = 'raw';

            _connection.send(json);
            return true;
        },

        // send raw JSON message to a specific recipient
        sendRawTo: function(recipient, json) {
            if (!_connection) {
                return false;
            }

            // mark as raw message to avoid hijacking
            json.msg = 'raw';

            _connection._rawSend(recipient, json);
            return true;
        },

        // quit session
        quit: function() {
            if (!_connection) {
                return;
            }

            // clean up if no remote counterpart
            if (!sendQuitMessage()) {
                cleanUp(true, false);
            }
        }
    };

})();

