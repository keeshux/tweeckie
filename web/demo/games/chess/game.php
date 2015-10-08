<?php
$colour = isset($_GET['colour']) ? $_GET['colour'] : 0;
$limit = isset($_GET['limit']) ? $_GET['limit'] : 0;
?>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
    <head>
        <title>tweeckie - chess</title>

        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <link rel="stylesheet" type="text/css" href="/tweeckie/core/tweeckie.css" />
        <link rel="stylesheet" type="text/css" href="/tweeckie/games/chess/style.css" />
    </head>
    <body>
<?php readfile('../../../tweeckie/games/chess/layout.html') ?>

        <!-- libraries -->
        <script type="text/javascript" src="/cdn/jquery.min.js"></script>
        <script type="text/javascript" src="/cdn/jquery-ui.min.js"></script>
        <!-- libraries -->

        <script type="text/javascript" src="/tweeckie/core/tweeckie.js"></script>
        <script type="text/javascript" src="/tweeckie/games/chess/engine.js"></script>
        <script type="text/javascript">
        <!--
$(function() {
    var colour = parseInt('<?php echo $colour ?>');
    var limit = parseInt('<?php echo $limit ?>');

    tck.settings.debug = true;
    tck.settings.mq.debug = true;

    tck.tests.chess({
        colour: colour,
        limit: limit
    });
});
        //-->
        </script>
    </body>
</html>

