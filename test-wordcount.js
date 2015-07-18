var assert = require("chai").assert;
var imm = require("immutable");
var mr = require("./mapred.js");
var tdiff = require("./tdiff.js");
var util = require("./util.js");
var wc = require("./wordcount.js");

util.assertEqual(imm.List(),
                 wc.wordCountMapChangeToEntries(tdiff.NO_CHANGE));

util.assertEqual(imm.List([mr.makeEntry("foo", tdiff.rem(1))]),
                 wc.wordCountMapChangeToEntries(tdiff.rem("foo")));

util.assertEqual(imm.List([mr.makeEntry("hello", tdiff.add(1)),
                           mr.makeEntry("world", tdiff.add(1))]),
                 wc.wordCountMapChangeToEntries(tdiff.add("hello world")));

util.assertEqual(imm.List([mr.makeEntry("foo", tdiff.rem(1)),
                           mr.makeEntry("hello", tdiff.add(1)),
                           mr.makeEntry("world", tdiff.add(1))]),
                 wc.wordCountMapChangeToEntries(tdiff.change("foo", "hello world")));

util.assertEqual(imm.List([mr.makeEntry("foo", tdiff.rem(1)),
                           mr.makeEntry("hello", tdiff.add(1)),
                           mr.makeEntry("world", tdiff.add(1)),
                           mr.makeEntry("goodbye", tdiff.rem(1)),
                           mr.makeEntry("world", tdiff.rem(1))]),
                 wc.wordCountMapper(tdiff.makeDiff()
                                    .putChange("k1", tdiff.change("foo", "hello world"))
                                    .putChange("k2", tdiff.rem("goodbye world"))));


                 