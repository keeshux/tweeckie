<?php
header('Content-Type: text/javascript');

//function indenter($buffer) {
//    return preg_replace('/^/', '    ', $buffer);
//}
?>
// namespace
var tck = {};

(function() {

<?php
//ob_start('indenter');

// engine
readfile('engine/utils.js');
readfile('engine/pushmq.js');
readfile('engine/connection.js');
readfile('engine/bindings.js');
readfile('engine/player.js');
readfile('engine/game.js');
readfile('engine/board.js');
readfile('engine/public.js');
//ob_end_flush();
?>
    // client exports
    tck.api = api;
    tck.settings = settings;
    tck.callbacks = callbacks;

    // development exports
    tck.dev = {};
    tck.dev.Connection = Connection;
    tck.dev.SquareBoard = SquareBoard;
    tck.dev.GameModule = GameModule;
    tck.dev.Game = Game;
    tck.dev.Player = Player;
    tck.utils = utils;
    tck.tests = {};

})();

