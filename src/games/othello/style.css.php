<?php
header('Content-Type: text/css');

// independent
$piece = 50;
$logo = 50;
$cell_bw = 1;

// dependent
$highlight = $piece - 2 * $cell_bw;
?>
/* [GAME]: othello */

#tck-game-othello .tck-extra {
    display: none;
}

#tck-game-othello .tck-count {
    color: #888;
}

#tck-game-othello .tck-board-body {
    background-image: url('/tweeckie/games/othello/media/board.png');
}

#tck-game-othello .tck-board-body div {
    position: absolute;
}

#tck-game-othello .tck-piece {
    cursor: auto;
    width: <?php echo $piece ?>px; /* piece */
    height: <?php echo $piece ?>px; /* piece */
    z-index: 5;
}

#tck-game-othello .tck-reachable {
    cursor: pointer;
    width: <?php echo $piece ?>px; /* piece */
    height: <?php echo $piece ?>px; /* piece */
}

#tck-game-othello .tck-highlight {
    background-color: #F90;
    margin: <?php echo $cell_bw ?>px; /* cell_bw */
    width: <?php echo $highlight ?>px; /* highlight */
    height: <?php echo $highlight ?>px; /* highlight */
    filter: alpha(opacity=60);
    -moz-opacity: 0.6;
    -khtml-opacity: 0.6;
    opacity: 0.6;
    z-index: 0;
}

/* viewport at (0, 0) is top left - white piece */

#tck-game-othello .tck-piece {
    background-image: url('/tweeckie/games/othello/media/sprites.png');
    width: <?php echo $piece ?>px; /* piece */
    height: <?php echo $piece ?>px; /* piece */
}

.tck-othello-logo {
    background-image: url('/tweeckie/games/othello/media/sprites.png');
    background-position: 0px -<?php echo $piece ?>px;
    width: <?php echo $logo ?>px; /* logo */
    height: <?php echo $logo ?>px; /* logo */
}

/* regular pieces */

#tck-game-othello .tck-white-piece {
    background-position: 0px 0px;
}

#tck-game-othello .tck-black-piece {
    background-position: -<?php echo $piece ?>px 0px;
}

