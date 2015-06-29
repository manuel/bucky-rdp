var tdiff = module.exports;
var imm = require("immutable");
var assert = require("chai").assert;

tdiff.ADD = "add";
tdiff.REM = "rem";
tdiff.NO_CHANGE = {};

tdiff.Diff = imm.Record({
    changes: new imm.Map()
});

tdiff.Change = imm.Record({
    add: tdiff.NO_CHANGE,
    rem: tdiff.NO_CHANGE
});

tdiff.makeDiff = function() {
    return new tdiff.Diff();
}

tdiff.Diff.prototype.put = function(key, change) {
    assert.instanceOf(change, tdiff.Change);
    return this.updateIn(["changes"], function(changes) { return changes.set(key, change); });
}

tdiff.change = function(add, rem) {
    return new tdiff.Change({ add: add, rem: rem });
}

tdiff.add = function(add) {
    return tdiff.change(add, tdiff.NO_CHANGE);
}

tdiff.rem = function(rem) {
    return tdiff.change(tdiff.NO_CHANGE, rem);
}

