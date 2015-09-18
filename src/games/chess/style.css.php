<?php
header('Content-Type: text/css');

// independent
$piece = 50;
$piece_sm = 20;
$logo = 50;
$promo_xpad = 50;
$pr_item_margin = 5;

// dependent
$promo_width = 4 * $piece + $promo_xpad;
$promo_height = $piece + 2 * $pr_item_margin;
?>
/* [GAME]: chess */

#tck-game-chess {
    width: 620px;
}

#tck-game-chess .tck-extra {
    position: relative;
    float: right;
    width: 140px;
}

#tck-game-chess .tck-captured {
    width: <?php echo 4 * $piece_sm ?>px; /* 4 * piece_sm */
    height: <?php echo 4 * $piece_sm ?>px; /* 4 * piece_sm */
    margin: 10px auto;
    text-align: center;
}

#tck-game-chess .tck-time {
    color: #888;
}

#tck-game-chess .tck-board-body {
    background-image: url('/tweeckie/games/chess/media/board.png');
}

#tck-game-chess .tck-board-body div {
    position: absolute;
    width: <?php echo $piece ?>px; /* piece */
    height: <?php echo $piece ?>px; /* piece */
}

#tck-game-chess .tck-piece {
    cursor: auto;
}

#tck-game-chess .tck-piece-enabled {
    cursor: pointer;
}

#tck-game-chess .tck-highlight {
    background-color: #F90;
    filter: alpha(opacity=60);
    -moz-opacity: 0.6;
    -khtml-opacity: 0.6;
    opacity: 0.6;
    z-index: 0;
}

/* side controls */

#tck-game-chess .tck-history {
    border-style: solid;
    border-width: 1px;
    border-color: #CCC;
    width: 95%;
    height: 15em;
    font-family: monospace;
    font-size: 80%;
    overflow: auto;
}

/* overlays */

#tck-game-chess .tck-overlay {
    display: none;
    position: absolute;
    z-index: 1000;
}

#tck-game-chess .tck-promotion {
    list-style: none;
    background-color: #DC9;
    border: solid 2px #000;
    top: 50%;
    left: 50%;
    width: <?php echo $promo_width ?>px; /* promo_width */
    height: <?php echo $promo_height ?>px; /* promo_height */
    margin-left: <?php echo -$promo_width / 2 ?>px;
    margin-top: <?php echo -$promo_height / 2 ?>px;
    text-align: center;
}

#tck-game-chess .tck-promotion li {
    position: relative;
    display: inline-block; zoom: 1; *display: inline; /* IE7 */
    cursor: pointer;
    margin: <?php echo $pr_item_margin ?>px 0px; /* pr_item_margin */
}

/* viewport at (0, 0) is top left - white pawn */

#tck-game-chess .tck-piece {
    background-image: url('/tweeckie/games/chess/media/sprites.png');
    width: <?php echo $piece ?>px; /* piece */
    height: <?php echo $piece ?>px; /* piece */
}

#tck-game-chess .tck-piece-sm {
    background-image: url('/tweeckie/games/chess/media/sprites.png');
    display: inline-block; zoom: 1; *display: inline; /* IE7 */
    width: <?php echo $piece_sm ?>px; /* piece_sm */
    height: <?php echo $piece_sm ?>px; /* piece_sm */
}

.tck-chess-logo {
    background-image: url('/tweeckie/games/chess/media/sprites.png');
    background-position: -<?php echo 6 * $piece_sm ?>px -<?php echo 2 * $piece ?>px;
    width: <?php echo $logo ?>px; /* logo */
    height: <?php echo $logo ?>px; /* logo */
}

/* regular pieces */

#tck-game-chess .tck-white-pawn {
    background-position: 0px 0px;
}

#tck-game-chess .tck-white-rook {
    background-position: -<?php echo $piece ?>px 0px;
}

#tck-game-chess .tck-white-knight {
    background-position: -<?php echo 2 * $piece ?>px 0px;
}

#tck-game-chess .tck-white-bishop {
    background-position: -<?php echo 3 * $piece ?>px 0px;
}

#tck-game-chess .tck-white-queen {
    background-position: -<?php echo 4 * $piece ?>px 0px;
}

#tck-game-chess .tck-white-king {
    background-position: -<?php echo 5 * $piece ?>px 0px;
}

#tck-game-chess .tck-black-pawn {
    background-position: 0px -<?php echo $piece ?>px;
}

#tck-game-chess .tck-black-rook {
    background-position: -<?php echo $piece ?>px -<?php echo $piece ?>px;
}

#tck-game-chess .tck-black-knight {
    background-position: -<?php echo 2 * $piece ?>px -<?php echo $piece ?>px;
}

#tck-game-chess .tck-black-bishop {
    background-position: -<?php echo 3 * $piece ?>px -<?php echo $piece ?>px;
}

#tck-game-chess .tck-black-queen {
    background-position: -<?php echo 4 * $piece ?>px -<?php echo $piece ?>px;
}

#tck-game-chess .tck-black-king {
    background-position: -<?php echo 5 * $piece ?>px -<?php echo $piece ?>px;
}

/* small pieces */

#tck-game-chess .tck-white-pawn-sm {
    background-position: 0px -<?php echo 2 * $piece ?>px;
}

#tck-game-chess .tck-white-rook-sm {
    background-position: -<?php echo $piece_sm ?>px -<?php echo 2 * $piece ?>px;
}

#tck-game-chess .tck-white-knight-sm {
    background-position: -<?php echo 2 * $piece_sm ?>px -<?php echo 2 * $piece ?>px;
}

#tck-game-chess .tck-white-bishop-sm {
    background-position: -<?php echo 3 * $piece_sm ?>px -<?php echo 2 * $piece ?>px;
}

#tck-game-chess .tck-white-queen-sm {
    background-position: -<?php echo 4 * $piece_sm ?>px -<?php echo 2 * $piece ?>px;
}

#tck-game-chess .tck-white-king-sm {
    background-position: -<?php echo 5 * $piece_sm ?>px -<?php echo 2 * $piece ?>px;
}

#tck-game-chess .tck-black-pawn-sm {
    background-position: 0px -<?php echo 2 * $piece + $piece_sm ?>px;
}

#tck-game-chess .tck-black-rook-sm {
    background-position: -<?php echo $piece_sm ?>px -<?php echo 2 * $piece + $piece_sm ?>px;
}

#tck-game-chess .tck-black-knight-sm {
    background-position: -<?php echo 2 * $piece_sm ?>px -<?php echo 2 * $piece + $piece_sm ?>px;
}

#tck-game-chess .tck-black-bishop-sm {
    background-position: -<?php echo 3 * $piece_sm ?>px -<?php echo 2 * $piece + $piece_sm ?>px;
}

#tck-game-chess .tck-black-queen-sm {
    background-position: -<?php echo 4 * $piece_sm ?>px -<?php echo 2 * $piece + $piece_sm ?>px;
}

#tck-game-chess .tck-black-king-sm {
    background-position: -<?php echo 5 * $piece_sm ?>px -<?php echo 2 * $piece + $piece_sm ?>px;
}

