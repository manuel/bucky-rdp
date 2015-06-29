var tdiff = require("./tdiff.js");
var imm = require("immutable");
var assert = require("chai").assert;

var diff1 = tdiff.makeDiff();
var diff2 = tdiff.makeDiff();
assert.isTrue(imm.is(diff1, diff2));

assert.isTrue(imm.is(diff1.put("k1", tdiff.add("foo")).put("k2", tdiff.add("bar")),
                     diff2.put("k2", tdiff.add("bar")).put("k1", tdiff.add("foo"))));
