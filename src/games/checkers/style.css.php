<?php
header('Content-Type: text/css');

// independent
$piece = 50;
$piece_sm = 20;
$logo = 50;
?>
/* [GAME]: checkers */

#tck-game-checkers .tck-extra {
    display: none;
}

#tck-game-checkers .tck-board-rows,
#tck-game-checkers .tck-board-columns {
    visibility: hidden;
}

#tck-game-checkers .tck-board-body {
    background-image: url('/tweeckie/games/checkers/media/board.png');
}

#tck-game-checkers .tck-board-body div {
    position: absolute;
    width: <?php echo $piece ?>px; /* piece */
    height: <?php echo $piece ?>px; /* piece */
}

#tck-game-checkers .tck-piece {
    cursor: auto;
}

#tck-game-checkers .tck-piece-enabled {
    cursor: pointer;
}

#tck-game-checkers .tck-highlight {
    background-color: #F90;
    filter: alpha(opacity=60);
    -moz-opacity: 0.6;
    -khtml-opacity: 0.6;
    opacity: 0.6;
    z-index: 0;
}

/* viewport at (0, 0) is top left - white man */

#tck-game-checkers .tck-piece {
    background-image: url('/tweeckie/games/checkers/media/sprites.png');
    width: <?php echo $piece ?>px; /* piece */
    height: <?php echo $piece ?>px; /* piece */
}

.tck-checkers-logo {
    background-image: url('/tweeckie/games/checkers/media/sprites.png');
    background-position: 0px -<?php echo $piece ?>px;
    width: <?php echo $logo ?>px; /* logo */
    height: <?php echo $logo ?>px; /* logo */
}

/* regular pieces */

#tck-game-checkers .tck-white-man {
    background-position: 0px 0px;
}

#tck-game-checkers .tck-white-king {
    background-position: -<?php echo $piece ?>px 0px;
}

#tck-game-checkers .tck-black-man {
    background-position: -<?php echo 2 * $piece ?>px 0px;
}

#tck-game-checkers .tck-black-king {
    background-position: -<?php echo 3 * $piece ?>px 0px;
}

