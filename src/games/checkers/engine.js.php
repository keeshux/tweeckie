<?php
header('Content-Type: text/javascript');
?>
// [GAME]: checkers

(function() {

<?php
readfile('engine/globals.js');
readfile('engine/game.js');
readfile('engine/gui.js');
readfile('engine/board.js');
readfile('engine/piece.js');
readfile('engine/tree.js');
readfile('engine/player.js');
readfile('engine/bootstrap.js');
readfile('engine/test.js');
?>
    bootstrap();

})();

