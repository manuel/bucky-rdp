var rdp = require("./rdp.js");
var assert = require("chai").assert;

function behaviorsEqual(b1, b2) {
    return evaluateSignal(b1) === evaluateSignal(b2);
}

function evaluateSignal(b) {
    var sigIn = rdp.makeSignal();
    try {
        var sigOut = rdp.apply(b, sigIn);
        sigIn.setValue(null);
        return sigOut.getValue();
    } finally {
        sigIn.deactivate();
    }
}

function bTimes(n) {
    return rdp.bFMap(function(x) { return x * n; });
}

assert.isTrue(behaviorsEqual(rdp.bConst(30),
                             rdp.bConst(30)));

assert.isTrue(behaviorsEqual(rdp.bConst(30),
                             rdp.bPipe(rdp.bConst(2), bTimes(3), bTimes(5))));
