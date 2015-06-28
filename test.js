var rdp = require("./rdp.js");
var assert = require("chai").assert;

/*
function behaviorsEqual(b1, b2) {
    return evaluateSignal(b1) === evaluateSignal(b2);
}

function evaluateSignal(b) {
    var sigIn = rdp.makeSignal();
    var sigOut = rdp.apply(b, sigIn);
    assert.isFalse(sigOut.isActive());
    sigIn.setValue(null);
    assert.isTrue(sigOut.isActive());
    var val = sigOut.getValue();
    sigIn.deactivate();
    assert.isFalse(sigOut.isActive());
    return val;
}

function bTimes(n) {
    return rdp.bFMap(function(x) { return x * n; });
}

assert.isTrue(behaviorsEqual(rdp.bConst(30),
                             rdp.bConst(30)));

assert.isTrue(behaviorsEqual(rdp.bConst(30),
                             rdp.bPipe(rdp.bConst(30))));

assert.isTrue(behaviorsEqual(rdp.bConst(30),
                             rdp.bPipe(rdp.bConst(2), bTimes(3), bTimes(5))));

*/

// Create some behaviors for transforming numbers.
var bDouble = rdp.bFMap(function(val) { return val * 2; });
var bMinusOne = rdp.bFMap(function(val) { return val - 1; });
// Create a pipeline behavior of the two behaviors
var myBehavior = rdp.bPipe(bDouble, bMinusOne);
// Apply an inactive input signal to the pipeline behavior
var THE_VAL = null;
var sigIn = rdp.makeSignal(function(cb) { process.nextTick(function() { cb(null, THE_VAL); }); });
var sigOut = rdp.apply(myBehavior, sigIn);
// Change the input signal value and watch the output signal change
THE_VAL = 2;
sigIn.update();
sigOut.getValue(function(err, val) {
    if (err) {
        throw err;
    } else {
        console.log(val);
        assert.equal(val, 3);
        THE_VAL = 4;
        sigIn.update();
        sigOut.getValue(function(err, val) {
            if (err) {
                throw err;
            } else {
                console.log(val);
                assert.equal(val, 7);
            }
        });
    }
});
sigIn.deactivate();
assert.throws(function() { sigOut.getValue(function(ignore) {}); });
