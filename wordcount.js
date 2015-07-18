var wc = module.exports;
var assert = require("chai").assert;
var imm = require("immutable");
var mr = require("./mapred.js");
var tdiff = require("./tdiff.js");

//// Mapper

wc.wordCountMapper = function(diff) {
    assert.instanceOf(diff, tdiff.Diff);
    var res = imm.List();
    diff.forEachChange(function(change, key_ignored) {
        res = res.concat(wc.wordCountMapChangeToEntries(change));
    });
    return res;
}

wc.wordCountMapChangeToEntries = function(change) {
    assert.instanceOf(change, tdiff.Change);
    var res = imm.List();
    res = res.concat(wc.wordCountMapInsnToEntries(change, tdiff.REM, tdiff.ADD));
    res = res.concat(wc.wordCountMapInsnToEntries(change, tdiff.ADD, tdiff.REM));
    return res;
}

wc.wordCountMapInsnToEntries = function(change, posInsn, negInsn) {
    assert.instanceOf(change, tdiff.Change);
    var insn = change.get(posInsn);
    if (imm.is(insn, tdiff.NO_MOD)) {
        return imm.List();
    } else {
        return imm.List(insn.split(" ").map(function(word) {
            var initParams = {};
            initParams[posInsn] = 1;
            initParams[negInsn] = tdiff.NO_MOD;
            return mr.makeEntry(word, new tdiff.Change(initParams));
        }));
    }
}

//// Reducer

wc.wordCountReducer = function(key, changes) {
    var change = wc.wordCountReduceChanges(changes);
    return mr.makeEntry(key, change);
}

wc.wordCountReduceChanges = function(changes) {
    var init = tdiff.NO_CHANGE;
    var change = changes.reduce(function(chg1, chg2) {
        assert.instanceOf(chg1, tdiff.Change);
        assert.instanceOf(chg2, tdiff.Change);
        var pos1 = chg1.get(tdiff.ADD);
        var pos2 = chg2.get(tdiff.ADD);
        var neg1 = chg1.get(tdiff.REM);
        var neg2 = chg2.get(tdiff.REM);
        pos1 = pos1 === tdiff.NO_MOD ? 0 : pos1;
        pos2 = pos2 === tdiff.NO_MOD ? 0 : pos2;
        neg1 = neg1 === tdiff.NO_MOD ? 0 : neg1;
        neg2 = neg2 === tdiff.NO_MOD ? 0 : neg2;
        return tdiff.add(((pos1 + pos2) - neg1) - neg2);
    }, init);
    if (change.get(tdiff.ADD) === 0) {
        return tdiff.NO_CHANGE;
    } else {
        return change;
    }
}
