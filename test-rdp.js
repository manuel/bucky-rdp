var rdp = require("./rdp.js");
var assert = require("chai").assert;

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
        assert.equal(val, 3);
        THE_VAL = 4;
        sigIn.update();
        sigOut.getValue(function(err, val) {
            if (err) {
                throw err;
            } else {
                assert.equal(val, 7);
            }
        });
    }
});
sigIn.deactivate();
assert.throws(function() { sigOut.getValue(function(ignore) {}); });
