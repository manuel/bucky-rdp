var rdp = require("./rdp.js");
var tdiff = require("./tdiff.js");
var mem = require("./memstore.js");
var imm = require("immutable");
var assert = require("chai").assert;

// Create empty memstore and apply its read behavior to an empty main
// signal, to obtain the read signal.
var s = mem.makeMemStore();
var mainSig = rdp.makeNullSignal();
var readSig = rdp.apply(s.bRead(), mainSig);
mainSig.update();

// Get contents of read signal, expecting an empty answer.
readSig.getValue(function(err, val, options) {
    if (err) {
        throw err;
    } else {
        assert.equal(options.version, 0);
        assert.isTrue(imm.is(val, rdp.makePage(tdiff.makeDiff())));
        // Update the memstore twice
        var patch1 = tdiff.makeDiff().putChange("title", tdiff.add("hello world"));
        s.patch(patch1);
        var patch2 = tdiff.makeDiff().putChange("text", tdiff.add("it works"));
        s.patch(patch2);
        // Get complete contents by not specifying version
        readSig.getValue(function(err, val, options) {
            if (err) {
                throw err;
            } else {
                assert.equal(options.version, 2);
                assert.isTrue(imm.is(val, rdp.makePage(tdiff.mergeDiffs(patch1, patch2))));
            }
        });
        // Get diff contents of last change by specifying the previous version (1)
        readSig.getValue(function(err, val, options) {
            if (err) {
                throw err;
            } else {
                assert.equal(options.version, 2);
                assert.isTrue(imm.is(val, rdp.makePage(patch2)));
            }
        }, { version: 1 });
        // Make sure asking for current version (2) yields no content status
        readSig.getValue(function(err, val, options) {
            assert.isTrue(rdp.isRDPError(err));
            assert.equal(rdp.getErrorStatus(err), rdp.NO_CONTENT_STATUS);
            assert.equal(options.version, 2);
        }, { version: 2 });
        // Make sure asking for older version yields conflict status
        readSig.getValue(function(err, val, options) {
            assert.isTrue(rdp.isRDPError(err));
            assert.equal(rdp.getErrorStatus(err), rdp.CONFLICT_STATUS);
            assert.equal(options.version, 2);
        }, { version: 0 });
    }
});
