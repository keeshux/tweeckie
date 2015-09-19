# tweeckie

tweeckie is a JavaScript framework made to develop 1-on-1 games on top of the [nginx HTTP Push Module](https://github.com/slact/nginx_http_push_module). It currently comes with three games: Chess, Checkers (Draughts) and Othello (Reversi).

See the framework in action:

[http://tweeckie.com](http://tweeckie.com)

# Compilation

Compile `core` with the following script:

    scripts/compile-core.sh

Compile each game in `games` with the following script:

    scripts/compile-game.sh chess

where `chess` is just an example.

The compilation result is stored into the `dist` directory. If you have [closure-compiler](https://developers.google.com/closure/compiler/) installed, append a `min` parameter to any of the two scripts above to generate minified JavaScript.

# Demo

First of all, add a website to nginx pointing to the `web` directory. HTTP Push Module and PHP support are a requirement. Example:

    server {
        listen       80;
        server_name  tweeckie-example.com;
        root         /path/to/tweeckie/web;
        
        ...
        
        # HTTP Push Module
        location /mq/send {
            access_log off;
            push_publisher;
            set $push_channel_id $arg_id;
            push_store_messages on;
            #push_channel_timeout 30m;
            push_message_timeout 5m;
            push_max_message_buffer_length 10;
        }
        location /mq/recv {
            access_log off;
            push_subscriber;
            set $push_channel_id $arg_id;
            #push_authorized_channels_only on;
            push_subscriber_concurrency broadcast;
            push_subscriber_timeout 1m;
            push_max_channel_subscribers 10;
            default_type application/json;
        }
    
        # PHP
        location ~ \.php$ {
            include fastcgi.conf;
            fastcgi_pass unix:/usr/local/var/run/php-fpm.socket;
        }
    }

Web demos are kind of raw and can be found under the `demo` directory:

* [core/board.html](web/demo/core/board.html) - Show standard square board
* [games/*/sprites.html](web/demo/games/chess/sprites.html) - Show all game sprites
* [games/*/game.php](web/demo/games/chess/game.php) - Play game in single mode
* [net/create.html](web/demo/net/create.html), [net/join.html](web/demo/net/join.html) - Play game with p2p handshake

# Client development

The `tck` object is exported by `core/tweeckie.js`.

WARNING: settings and callbacks can only be altered BEFORE a connection has been established.

## `tck.api`

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

## `tck.settings`

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

## `tck.callbacks`

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

The module name must match its directory and the `game` field in the configuration map passed to method `tck.api.create`

These CSS selectors are autofilled upon players connection:

    .tck-local-nickname         own nickname
    .tck-remote-nickname        opponent nickname

Every field enclosed (at any level) in the following variables must be quoted because it will be publicly visible and must therefore retain its name after closure advanced optimizations:

    tck (public namespace)
    cfg (received in Game subclasses constructor)
