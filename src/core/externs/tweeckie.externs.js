/*
 * tweeckie v1.0
 *
 * Copyright 2011, Davide De Rosa (keeshux)
 * Released under the GPL v3 (see LICENSE)
 *
 * http://tweeckie.com
 * http://davidederosa.com
 *
 */

var tck;

// client exports

tck.api;
tck.api.create = function(cfg, channel) {};
tck.api.join = function(channel, ownSuffix) {};
tck.api.channel = function() {};
tck.api.sessionStarted = function() {};
tck.api.isCreator = function() {};
tck.api.isOpponent = function() {};
tck.api.ownNickname = function() {};
tck.api.remoteNickname = function() {};
tck.api.say = function(what) {};
tck.api.sendRaw = function(json) {};
tck.api.sendRawTo = function(recipient, json) {};
tck.api.quit = function() {};

tck.settings;
tck.settings.debug;
tck.settings.nickname;
tck.settings.channel;
tck.settings.idChars;
tck.settings.channelLen;
tck.settings.suffixLen;
tck.settings.disconnectOnQuit;
tck.settings.mq;
tck.settings.mq.debug;
tck.settings.mq.pubUrl;
tck.settings.mq.subUrl;
tck.settings.mq.sendTimeout;
tck.settings.mq.sendRetry;
tck.settings.mq.pollTimeout;
tck.settings.mq.pollDelay;
tck.settings.mq.pollRetry;
tck.settings.syncInterval;

tck.callbacks;
tck.callbacks.onGameLoad = function(name) {};
tck.callbacks.onCreate = function(channel, cfg) {};
tck.callbacks.onAccept = function(me, opponent, cfg) {};
tck.callbacks.onRefuse = function(reason) {};
tck.callbacks.onNotice = function(notice) {};
tck.callbacks.onChat = function(opponent, message) {};
tck.callbacks.onQuit = function(opponent) {};
tck.callbacks.onDisconnect = function(wasConnected) {};
tck.callbacks.onRawMessage = function(json) {};

// developer exports

tck.dev;

tck.utils;
tck.utils.randomString = function(haystack, len) {};
tck.utils.reverseString = function(s) {};
tck.utils.arrayCount = function(v, o, equals) {};
tck.utils.shallowEquals = function(o1, o2) {};
tck.utils.invert = function(n) {};
tck.utils.readableTime = function(t) {};

//tck.dev.Connection = function(sessionId) {};
tck.dev.Connection;
tck.dev.Connection.prototype.makeQueue = function(netId) {};
tck.dev.Connection.prototype.connect = function(onConnect, onPublish) {};
tck.dev.Connection.prototype.disconnect = function() {};
tck.dev.Connection.prototype.send = function(obj) {};
//tck.dev.Connection.prototype.sendGuests = function(obj) {};
tck.dev.Connection.prototype.broadcast = function(obj) {};

//tck.dev.GameModule = function(name) {};
tck.dev.GameModule;
tck.dev.GameModule.prototype.name;
tck.dev.GameModule.prototype.clazz;
tck.dev.GameModule.prototype.makeConfiguration = function() {};
tck.dev.GameModule.newModule = function(name) {};
tck.dev.GameModule.registerModule = function(name, module) {};
tck.dev.GameModule.unregisterModule = function(name) {};
tck.dev.GameModule.getRegisteredModuleNames = function() {};
tck.dev.GameModule.getRegisteredModule = function(name) {};
tck.dev.GameModule.prototype.load = function(target) {};
tck.dev.GameModule.prototype.unload = function() {};

tck.dev.Game;
tck.dev.Game.prototype.connection;
tck.dev.Game.prototype.state;
tck.dev.Game.prototype.local;
tck.dev.Game.prototype.remote;
tck.dev.Game.prototype.testing;
tck.dev.Game.INIT;
tck.dev.Game.STARTED;
tck.dev.Game.ENDED;
tck.dev.Game.prototype.getPlayers = function() {};
tck.dev.Game.prototype.isLocal = function(player) {};
tck.dev.Game.prototype.isRemote = function(player) {};
tck.dev.Game.prototype.whois = function(player) {};
tck.dev.Game.prototype.start = function() {};
tck.dev.Game.prototype.stop = function() {};
tck.dev.Game.prototype.reset = function() {};
tck.dev.Game.prototype.onMessage = function(json) {};

tck.dev.Player;
tck.dev.Player.prototype.nickname;

//tck.dev.SquareBoard = function(target, size, edge, edgeSm) {};
tck.dev.SquareBoard;
tck.dev.SquareBoard.prototype.toRow = function(i) {};
tck.dev.SquareBoard.prototype.toColumn = function(j) {};
tck.dev.SquareBoard.prototype.isInside = function(i, j) {};
tck.dev.SquareBoard.prototype.show = function(rotated) {};
tck.dev.SquareBoard.prototype.clear = function() {};
tck.dev.SquareBoard.prototype.draw = function() {};
tck.dev.SquareBoard.prototype.pos2Coords = function(pos) {};
tck.dev.SquareBoard.prototype.coords2Pos = function(point) {};
tck.dev.SquareBoard.prototype.serialize = function() {};
tck.dev.SquareBoard.prototype.print = function() {};

tck.tests;

