var tdiff = require("./tdiff.js");
var imm = require("immutable");
var assert = require("chai").assert;

var diff1 = tdiff.makeDiff();
var diff2 = tdiff.makeDiff();
assert.isTrue(imm.is(diff1, diff2));

assert.isTrue(imm.is(diff1.put("k1", tdiff.add("foo")).put("k2", tdiff.add("bar")),
                     diff2.put("k2", tdiff.add("bar")).put("k1", tdiff.add("foo"))));

function assertEqual(obj1, obj2) {
    if (!imm.is(obj1, obj2)) {
        throw "Expected " + obj1 + " and " + obj2 + " to be equal.";
    }
}

assertEqual(tdiff.change("foo", "bar"),
            tdiff.mergeChanges(tdiff.change("foo", "bar"),
                               tdiff.change(tdiff.NO_MOD, tdiff.NO_MOD)));

assertEqual(tdiff.change(tdiff.NO_MOD, "bar"),
            tdiff.mergeChanges(tdiff.change(tdiff.NO_MOD, "bar"),
                               tdiff.change(tdiff.NO_MOD, tdiff.NO_MOD)));

assertEqual(tdiff.change("foo", tdiff.NO_MOD),
            tdiff.mergeChanges(tdiff.change("foo", tdiff.NO_MOD),
                               tdiff.change(tdiff.NO_MOD, tdiff.NO_MOD)));

assertEqual(tdiff.change("foo", tdiff.NO_MOD),
            tdiff.mergeChanges(tdiff.change("foo", "bar"),
                               tdiff.change("bar", tdiff.NO_MOD)));

assertEqual(tdiff.change(tdiff.NO_MOD, "bar"),
            tdiff.mergeChanges(tdiff.change("foo", "bar"),
                               tdiff.change(tdiff.NO_MOD, "foo")));

assert.throws(function() {
    tdiff.mergeChanges(tdiff.change("foo", "bar"),
                       tdiff.change("quux", "bleh"));
});

assert.throws(function() {
    tdiff.mergeChanges(tdiff.change("foo", tdiff.NO_MOD),
                       tdiff.change("quux", tdiff.NO_MOD));
});

assert.throws(function() {
    tdiff.mergeChanges(tdiff.change(tdiff.NO_MOD, "bar"),
                       tdiff.change(tdiff.NO_MOD, "bleh"));
});

/*
assert.isTrue(imm.is(tdiff.makeDiff().put("k", tdiff.add("new")),
                     tdiff.mergeDiffs(
                         tdiff.makeDiff().put("k", tdiff.change("old", "new")),
                         tdiff.makeDiff().put("k", tdiff.add("old")))));

*/