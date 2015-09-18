<?php
// independent
$piece = 50;
$piece_sm = 20;
$board_bw = 3;
$rows_width = 20;

// dependent
$board_size = 8 * $piece;
$wrapper_width = $board_size + 2 * ($board_bw + $rows_width);
?>
.tck-board {
    position: relative;
    width: <?php echo $wrapper_width ?>px; /* wrapper_width */
}

.tck-board-rows,
.tck-board-columns,
.tck-board-content {
    -moz-user-select: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -o-user-select: none;
    user-select: none;
}

.tck-board-rows {
    width: <?php echo $rows_width ?>px; /* rows_width */
    margin: <?php echo $board_bw ?>px 0px; /* board_bw, 0 */
}

.tck-board-rows li {
    display: block;
    height: <?php echo $piece ?>px; /* piece */
    line-height: <?php echo $piece ?>px; /* piece */
    text-align: center;
}

.tck-board-columns {
    text-align: center;
    margin: 4px 0px;
}

.tck-board-columns li {
    display: inline-block; zoom: 1; *display: inline; /* IE7 */
    text-align: center;
    width: <?php echo $piece ?>px; /* piece */
}

.tck-board-body {
    position: relative;
    border: solid <?php echo $board_bw ?>px #000; /* board_bw */
    width: <?php echo $board_size ?>px; /* board_size */
    height: <?php echo $board_size ?>px; /* board_size */
    margin: 0px <?php echo $rows_width ?>px; /* rows_width */
}

