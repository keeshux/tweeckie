# tweeckie

tweeckie is a JavaScript framework made to develop 1vs1 games on top of the [nginx HTTP Push Module](https://github.com/slact/nginx_http_push_module). It currently comes with three games: Chess, Checkers (Draughts) and Othello (Reversi).

See the framework in action:

[http://tweeckie.com](http://tweeckie.com)

# Client development

## Tests

First of all, add a website (e.g. `http://example.com`) to nginx pointing to the `web` directory. PHP support and HTTP Push Module are a requirement.

Web tests are kind of raw and can be found under the `test` directory:

* `core/board.html` - Show standard square board
* `games/*/sprites.html` - Show all game sprites
* `games/*/game.php` - Play game in single mode
* `net/create.html`, `net/join.html` - Play game (chess) with p2p handshake

## Settings

WARNING: settings can only be altered BEFORE a connection has been established.

### tck.api

|METHOD                  |RETURN (PARAMETERS)                        |
|------------------------|-------------------------------------------|
|loadGame                |(string gameName, string target)           |
|unloadGame              |(string gameName)                          |
|registeredGames         |()                                         |
|                        |                                           |
|create                  |(map cfg, [string channel])                |
|join                    |(string channel, [string ownSuffix])       |
|channel                 |()                                         |
|sessionStarted          |()                                         |
|isCreator               |()                                         |
|isOpponent              |()                                         |
|ownNickname             |()                                         |
|remoteNickname          |()                                         |
|say                     |string nickname (string what)              |
|sendRaw                 |boolean sent (map json)                    |
|sendRawTo               |boolean sent (string recipient, map json)  |
|quit                    |()                                         |

### tck.settings

|KEY                     |DEFAULT         |
|------------------------|----------------|
|debug                   |false           |
|nickname                |null (required) |
|channel                 |null (optional) |
|idChars                 |'0123456789'    |
|channelLen              |16              |
|suffixLen               |12              |
|disconnectOnQuit        |false           |
|mq.debug                |false           |
|mq.pubUrl               |'/mq/send?id=$1'|
|mq.subUrl               |'/mq/recv?id=$1'|
|mq.sendTimeout          |8000            |
|mq.sendRetry            |2000            |
|mq.pollTimeout          |60000           |
|mq.pollDelay            |100             |
|mq.pollRetry            |3000            |
|syncInterval            |30000           |

### tck.callbacks

|METHOD                  |(PARAMETERS)                         |
|------------------------|-------------------------------------|
|onGameLoad              |(string name)                        |
|onCreate                |(string channel, map cfg)            |
|onAccept                |(string me, string opponent, map cfg)|
|onRefuse                |(string reason)                      |
|onNotice                |(string notice)                      |
|onChat                  |(string opponent, string message)    |
|onQuit                  |(string opponent)                    |
|onDisconnect            |(boolean wasConnected)               |
|onRawMessage            |(map json)                           |

# Module development

Import your game module this way:

    var moduleName = 'your-game-name';
    var module = GameModule.newModule(moduleName);

    if (module) {
        ...
        ...

        GameModule.registerModule(module);
    }

The module name must match its directory and the 'game' field in the configuration map passed to method tck.api.create

These CSS selectors are autofilled upon players connection:

    .tck-local-nickname         own nickname
    .tck-remote-nickname        opponent nickname

Every field enclosed (at any level) in the following variables must be quoted because it will be publicly visible and must therefore retain its name after closure advanced optimizations:

    tck (public namespace)
    cfg (received in Game subclasses constructor)

