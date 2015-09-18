/**
 * @constructor
 */
// game metadata with embedded loader/unloader
function GameModule(name) {
    this.name = name;
    this.loaded = false;

    // referred elements
    this.$html = null;
    this.$css = null;
    this.$js = null;

    // must be set, module Game subclass
    this.clazz = null;

    // must be set, form to cfg conversion
    this.makeConfiguration = function() {
        throw 'GameModule.makeConfiguration: not implemented';
    };
}

//
// MODULE LOADER
//
// IMPORTANT: game name MUST match its directory
//
// step 1: (core) add module object to 'loadingRegistry' with game
//                name being the key
//
// step 2: (game engine) retrieve new (static) or partial (dynamic)
//                       module object with newModule(name) 
//                       and fill it with metadata and Game class
//
// step 3: (game engine) confirm loading module registration with
//                       registerModule(name)
//
// step 4: (core) now the module is officially loaded, saved
//                into 'registry' and available for use
//
// step 5: (core) invoke onGameLoad callback to inform the client
//                about operation success
//

GameModule.registry = {};
GameModule.loadingRegistry = {};

GameModule.newModule = function(name) {

    // avoid clashes from the beginning
    if (GameModule.registry[name]) {
        throw 'module "' + name + '" was already registered';
    }

    // when dynamically loaded (by script)
    var module = GameModule.loadingRegistry[name];

    // when statically loaded (by HTML)
    if (!module) {
        module = new GameModule(name);
    }

    return module;
};

GameModule.registerModule = function(module) {
    var name = module.name;

    // delete from temporary registry (possibly no entry)
    delete GameModule.loadingRegistry[name];

    // save object into registry
    GameModule.registry[name] = module;
    module.loaded = true;

    // external callback
    var onGameLoad = tck.callbacks.onGameLoad;
    onGameLoad && onGameLoad(module);
};

// to be invoked on game module unload
GameModule.unregisterModule = function(name) {
    delete GameModule.registry[name];
};

// all registered module names
GameModule.getRegisteredModuleNames = function() {
    var names = [];
    for (var key in GameModule.registry) {
        names.push(key);
    }
    return names;
};

// module by name, called in tck.api (newGame factory)
GameModule.getRegisteredModule = function(name) {
    return GameModule.registry[name];
};

// load game HTML/CSS/JS
GameModule.prototype.load = function(target) {
    if (this.loaded) {
        return;
    }

    // games settings
    var gs = tck.settings.games;

    // add to temporary loadingRegistry for module access
    GameModule.loadingRegistry[this.name] = this;

    // game resources URLs
    var root = gs.root;
    var htmlSrc = [root, this.name, gs.htmlFile].join('/');
    var cssSrc = [root, this.name, gs.cssFile].join('/');
    var jsSrc = [root, this.name, gs.jsFile].join('/');

    // IE fix for $.load
    //htmlSrc = [htmlSrc, '#', Math.random() * 99999].join('');
    //htmlSrc = [htmlSrc, '#', new Date().getTime()].join('');

    if (tck.settings.debug) {
        console.error('loading game HTML = %s', htmlSrc);
        console.error('loading game CSS = %s', cssSrc);
        console.error('loading game JS = %s', jsSrc);
    }

    // fragments destinations
    var $head = $('head');
    //var $body = $('body');

    // asynchronous, wait completion
    var _this = this;
    var $html = $(target);
    $html.load(htmlSrc, function() {

        // load CSS <link> entry
        var $css = $(document.createElement('link'));
        $css.attr({
            'rel': 'stylesheet',
            'href': cssSrc,
            'type': 'text/css'
        });
        $head.append($css);

        // load JavaScript <script> entry
        var $js = $(document.createElement('script'));
        $js.attr({
            'type': 'text/javascript',
            'src': jsSrc
        });
        //$body.children().last().after($js); // useless optimization at this point
        $head.append($js);

        // save for unload
        _this.$html = $html;
        _this.$css = $css;
        _this.$js = $js;
    });
};

GameModule.prototype.unload = function() {
    if (!this.loaded) {
        return;
    }

    // unregister game module
    GameModule.unregisterModule(this.name);

    // remove added content
    this.$html.empty();
    this.$css.remove();
    this.$js.remove();

    this.$html = null;
    this.$css = null;
    this.$js = null;

    this.loaded = false;
};

/**
 * @constructor
 */
// game base class
function Game() {
    this.connection = null;

    this.state = Game.INIT;
    this.local = null;
    this.remote = null;

    this.testing = false;
}

// game states
Game.INIT = 0;
Game.STARTED = 1;
Game.ENDED = 2;

// return local and remote player (in a meaningful order)
Game.prototype.getPlayers = function() {
    throw 'Game.getPlayers: not implemented';
};

Game.prototype.isLocal = function(player) {
    return (player === this.local);
};

Game.prototype.isRemote = function(player) {
    return (player === this.remote);
};

// return 'local' if player is local, 'remote' otherwise
Game.prototype.whois = function(player) {
    if (player === this.local) {
        return 'local';
    } else if (player === this.remote) {
        return 'remote';
    }
    //assert(false);
    throw 'invalid player';
};

// start match
Game.prototype.start = function() {
    throw 'Game.start: not implemented';
};

// stop match
Game.prototype.stop = function() {
    throw 'Game.stop: not implemented';
};

// clean up for restart
Game.prototype.reset = function() {
    throw 'Game.reset: not implemented';
};

// network message
Game.prototype.onMessage = function(json) {
    throw 'Game.onMessage: not implemented';
};

