#!/bin/bash
PWD=`pwd`
CLOSURE=closure-compiler
CLOSURE_OUT=closure-out
SRC=src/games/$1
CORE_EXTERNS=src/core/externs
DIST=dist/games/$1
CSS=style.css
JS=engine.js

if [ -z $1 ]; then
    echo 'Pass game module as first parameter'
    exit
fi

if [ ! -d $SRC ]; then
    echo 'Game module '\'''$1''\'' does not exist'
    exit
fi

# clean
rm -f $CLOSURE_OUT
rm -rf $DIST
mkdir -p $DIST

# make static
CSS_PATH=$PWD/$DIST/$CSS
JS_PATH=$PWD/$DIST/$JS
cat $SRC/HEADER >$DIST/$CSS
cat $SRC/HEADER >$DIST/$JS
( cd $SRC && php $CSS.php >>$CSS_PATH )
( cd $SRC && ./assemble-js.sh >>$JS_PATH )

# clone external data
cp -frp $SRC/lib $DIST/lib
cp -frp $SRC/media $DIST/media
cp -fp $SRC/layout.html $DIST/layout.html

# closure (optional)
if [[ $2 == 'min' ]]; then
    EXTERNS=externs
    FLAGS="--compilation_level ADVANCED_OPTIMIZATIONS --warning_level VERBOSE"
    #FLAGS="--compilation_level SIMPLE_OPTIMIZATIONS --warning_level VERBOSE"
    JS_MIN=${JS/\.js/.min.js}

    cat $DIST/$JS | $CLOSURE $FLAGS \
            --externs $EXTERNS/jquery.externs.js \
            --externs $EXTERNS/jquery-ui.externs.js \
            --externs $EXTERNS/json2.externs.js \
            --externs $EXTERNS/other.externs.js \
            --externs $CORE_EXTERNS/tweeckie.externs.js \
            --js_output_file $JS_MIN.tmp 2>$CLOSURE_OUT
    cat $SRC/HEADER $JS_MIN.tmp >$DIST/$JS_MIN
    rm -f $JS_MIN.tmp
    rm -f $DIST/$JS
fi

