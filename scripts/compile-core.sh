#!/bin/bash
PWD=$(pwd)
CLOSURE=closure-compiler
CLOSURE_OUT=closure-out
SRC=src/core
DIST=dist/core
CSS=tweeckie.css
JS=tweeckie.js
JS_MIN=${JS/\.js/.min.js}

# clean
rm -f $CLOSURE_OUT
rm -f $DIST/$CSS $DIST/$JS $DIST/$JS_MIN
mkdir -p $DIST

# make static
cat $SRC/HEADER >$DIST/$CSS
cat $SRC/HEADER >$DIST/$JS
CSS_PATH=$PWD/$DIST/$CSS
JS_PATH=$PWD/$DIST/$JS
( cd $SRC && sass tweeckie.scss >>$CSS_PATH )
( cd $SRC && ./assemble-js.sh >>$JS_PATH )

# closure (optional)
if [[ $1 == 'min' ]]; then
    EXTERNS=externs
    #FLAGS="--compilation_level ADVANCED_OPTIMIZATIONS --warning_level VERBOSE"
    FLAGS="--compilation_level SIMPLE_OPTIMIZATIONS --warning_level VERBOSE"

    cat $DIST/$JS | $CLOSURE $FLAGS \
            --externs $EXTERNS/jquery.externs.js \
            --externs $EXTERNS/jquery-ui.externs.js \
            --externs $EXTERNS/json2.externs.js \
            --externs $EXTERNS/other.externs.js \
            --js_output_file $JS_MIN.tmp 2>$CLOSURE_OUT
    cat $SRC/HEADER $JS_MIN.tmp >$DIST/$JS_MIN
    rm -f $JS_MIN.tmp
    rm -f $DIST/$JS
fi

