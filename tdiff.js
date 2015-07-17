var tdiff = module.exports;
var imm = require("immutable");
var assert = require("chai").assert;

tdiff.ADD = "add";
tdiff.REM = "rem";
tdiff.NO_MOD = {};

/// A diff is a "program" to modify a key-value table.
tdiff.Diff = imm.Record({
    changes: new imm.Map()
});

/// Each entry in a diff maps a key to a change.  A change is composed
/// of two instructions, one to add and one to remove a value.  An
/// instruction can also be NO_MOD, indicating no modification of
/// the value.
tdiff.Change = imm.Record({
    rem: tdiff.NO_MOD,
    add: tdiff.NO_MOD
});

tdiff.makeDiff = function() {
    return new tdiff.Diff();
}

tdiff.Diff.prototype.put = function(key, change) {
    assert.instanceOf(change, tdiff.Change);
    return this.setIn(["changes", key], change);
}

tdiff.change = function(rem, add) {
    return new tdiff.Change({ rem: rem, add: add });
}

tdiff.add = function(add) {
    return tdiff.change(tdiff.NO_MOD, add);
}

tdiff.rem = function(rem) {
    return tdiff.change(rem, tdiff.NO_MOD);
}

tdiff.NO_CHANGE = tdiff.change(tdiff.NO_MOD, tdiff.NO_MOD);

/// Modify a base diff by applying a patch diff to it.
tdiff.mergeDiffs = function(base, patch) {
}

/// Modify a base change by applying a patch change to it.
tdiff.mergeChanges = function(baseChg, patchChg) {
    assert.instanceOf(baseChg, tdiff.Change);
    assert.instanceOf(patchChg, tdiff.Change);
    var chg1 = tdiff.cancelInsns(baseChg.get(tdiff.REM), patchChg.get(tdiff.ADD));
    var chg2 = tdiff.cancelInsns(patchChg.get(tdiff.REM), baseChg.get(tdiff.ADD));
    return tdiff.change(tdiff.mergeInsns(chg1.get(tdiff.REM), chg2.get(tdiff.REM)),
                        tdiff.mergeInsns(chg1.get(tdiff.ADD), chg2.get(tdiff.ADD)));
}

/// A base change's instructions can be cancelled out by the opposing
/// instructions in the patch change.
tdiff.cancelInsns = function(insn, oppInsn) {
    if (imm.is(insn, oppInsn)) {
        return tdiff.NO_CHANGE;
    } else {
        return tdiff.change(insn, oppInsn);
    }
}

tdiff.mergeInsns = function(insn1, insn2) {
    if (imm.is(insn1, tdiff.NO_MOD)) {
        return insn2;
    } else {
        if (imm.is(insn2, tdiff.NO_MOD)) {
            return insn1;
        } else {
            throw tdiff.mergeError(insn1, insn2);
        }
    }
}

tdiff.mergeError = function(insn1, insn2) {
    return "Can't merge " + insn1 + " and " + insn2;
}
