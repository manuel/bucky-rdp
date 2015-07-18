var wc = module.exports;
var assert = require("chai").assert;
var imm = require("immutable");
var mr = require("./mapred.js");
var tdiff = require("./tdiff.js");

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
