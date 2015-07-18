///// Differential MapReduce

var mr = module.exports;
var imm = require("immutable");
var tdiff = require("./tdiff.js");
var assert = require("chai").assert;

/// tdiff.Diff :: Map<Key, tdiff.Change>
/// Entry :: (Key * tdiff.Change)
/// mapper :: tdiff.Diff -> List<Entry>
/// reducer :: Key -> List<tdiff.Change> -> Entry

mr.Entry = imm.Record({
    key: null,
    change: null
});

mr.makeEntry = function(key, change) {
    assert.instanceOf(change, tdiff.Change);
    return new mr.Entry({ key: key, change: change });
}

