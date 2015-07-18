var assert = require("chai").assert;
var imm = require("immutable");
var mr = require("./mapred.js");
var tdiff = require("./tdiff.js");
var util = require("./util.js");
var wc = require("./wordcount.js");

//// Mapper

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

//// Reducer

util.assertEqual(tdiff.add(27),
                 wc.wordCountReduceChanges(imm.List([tdiff.add(10),
                                                     tdiff.add(20),
                                                     tdiff.rem(5),
                                                     tdiff.change(2, 4)])));

util.assertEqual(tdiff.add(14),
                 wc.wordCountReduceChanges(imm.List([tdiff.add(-10),
                                                     tdiff.add(20),
                                                     tdiff.rem(-5),
                                                     tdiff.change(-7, -8)])));

util.assertEqual(tdiff.NO_CHANGE,
                 wc.wordCountReduceChanges(imm.List([])));

util.assertEqual(tdiff.NO_CHANGE,
                 wc.wordCountReduceChanges(imm.List([tdiff.add(10),
                                                     tdiff.rem(10)])));

util.assertEqual(tdiff.NO_CHANGE,
                 wc.wordCountReduceChanges(imm.List([tdiff.add(10),
                                                     tdiff.add(-10)])));

util.assertEqual(mr.makeEntry("word", tdiff.add(6)),
                 wc.wordCountReducer("word",
                                     imm.List([tdiff.add(1),
                                               tdiff.add(2),
                                               tdiff.add(3)])));
