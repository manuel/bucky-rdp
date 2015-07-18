///// Trivial implementation of Reactive Demand Programming
/// Manuel Simoni, msimoni@gmail.com, 2015-06-14. License: MIT

var rdp = module.exports;
// Manages callbacks
var EventEmitter = require("events").EventEmitter;
var imm = require("immutable");
// Provides assert
var chai = require("chai");
var assert = chai.assert;
chai.config.includeStack = true; // Print stacktrace when assertion fails
var tdiff = require("./tdiff.js");

//// Signal

/// A carrier for a discretely updating value.
rdp.Signal = function Signal(onGet) {
    assert.isFunction(onGet);
    // A signal is either active (carrying a value) or inactive.
    this.active = false;
    // Called when a client wants to retrieve the current value.
    this.onGet = onGet;
    // Callbacks for behaviors listening to changes of this signal.
    this.emitter = new EventEmitter();
}

/// Creates a new inactive signal.  This is the only way to create a
/// signal.  The first signal update with `update' will activate the
/// signal.
rdp.makeSignal = function(onGet) {
    return new rdp.Signal(onGet);
}

/// Returns a signal that always returns null.
rdp.makeNullSignal = function() {
    return rdp.makeSignal(function(cb) { process.nextTick(function() { cb(null, null); }); });
}

/// Retrieves the current value of an active signal.
/// Options:
/// options.version indicates that the client has a copy of that version and wants a diff against that.
/// (Defaults to rdp.NO_VERSION, indicating that the client doesn't have a copy of any version).
rdp.Signal.prototype.getValue = function(cb, options) {
    assert.isTrue(this.active, "Attempted to get value of inactive signal");
    if (typeof options === "undefined") {
        options = {};
    }
    return this.onGet(cb, options);
}

/// Updates the current value of a signal, activating it if it is
/// inactive.  Notifies downstream behaviors of the change.
rdp.Signal.prototype.update = function() {
    this.active = true;
    this.emitSignalUpdate();
}

/// Disables an active signal.  Notifies downstream behaviors so they
/// too can deactivate.
rdp.Signal.prototype.deactivate = function() {
    assert.isTrue(this.active, "Attempted deactivation of already inactive signal");
    this.active = false;
    this.emitSignalInactive();
}

/// Returns true if the signal is active.
rdp.Signal.prototype.isActive = function() {
    return this.active;
}

// Name of event for signal change.
rdp.SIGNAL_UPDATE_EVENT = "rdpSignalUpdate";
// Name of event for signal deactivation.
rdp.SIGNAL_INACTIVE_EVENT = "rdpSignalInactive";

/// Internal: notify downstream behaviors of change.
rdp.Signal.prototype.emitSignalUpdate = function() {
    this.emitter.emit(rdp.SIGNAL_UPDATE_EVENT);
}

/// Internal: notify downstream behaviors of deactivation.
rdp.Signal.prototype.emitSignalInactive = function() {
    this.emitter.emit(rdp.SIGNAL_INACTIVE_EVENT);
}

/// Internal: used by behaviors to subscribe to changes of a signal.
rdp.Signal.prototype.addListener = function(onSignalUpdate, onSignalInactive) {
    assert.isFunction(onSignalUpdate, "onSignalUpdate");
    assert.isFunction(onSignalInactive, "onSignalInactive");
    this.emitter.addListener(rdp.SIGNAL_UPDATE_EVENT, onSignalUpdate);
    this.emitter.addListener(rdp.SIGNAL_INACTIVE_EVENT, onSignalInactive);
}

//// Pages

rdp.Page = imm.Record({
    patch: null
});

rdp.makePage = function(patch) {
    assert.instanceOf(patch, tdiff.Diff);
    return new rdp.Page({ patch: patch });
}

rdp.Page.prototype.getPatch = function() {
    return this.get("patch");
}

//// Errors

rdp.makeError = function(status) {
    assert.isString(status);
    return { rdpStatus: status };
}

rdp.isRDPError = function(error) {
    return typeof error.rdpStatus !== "undefined";
}

rdp.getErrorStatus = function(error) {
    var status = error.rdpStatus;
    assert.isString(status);
    return status;
}

/// Sent to client when client's copy of value matches server's.
rdp.NO_CONTENT_STATUS = "204";

rdp.noContentError = function() {
    return rdp.makeError(rdp.NO_CONTENT_STATUS);
}

/// Sent to client when server cannot create a diff against a
/// client-requested version of the value, and the client has to
/// refetch the whole value.
rdp.CONFLICT_STATUS = "409";

rdp.conflictError = function() {
    return rdp.makeError(rdp.CONFLICT_STATUS);
}

//// Behavior

/// A behavior takes an input signal and emits data in an output
/// signal.
rdp.Behavior = function Behavior() {
}

/// Creates a concrete instance of a behavior that reads data from the
/// given input signal, and returns the instance's output signal.  The
/// input signal has to be inactive; its first activation will start
/// the behavior.
rdp.apply = function(b, sigIn) {
    assert.instanceOf(b, rdp.Behavior);
    assert.instanceOf(sigIn, rdp.Signal);
    assert.isFalse(sigIn.isActive(), "Attempted to apply behavior to already active signal");
    return b.rdpApply(b, sigIn);
}

//// Constant Behavior

/// A constant behavior produces an unchanging output signal while its
/// input signal is active.  The actual value of the input signal is
/// simply ignored.
rdp.BConst = function BConst(val) {
    this.val = val;
}

rdp.BConst.prototype = new rdp.Behavior();

/// Creates a new constant behavior with the given value as output
/// signal.
rdp.bConst = function(val) {
    return new rdp.BConst(val);
}

/// Simply sets the value of its output signal while its input signal
/// is active.
rdp.BConst.prototype.rdpApply = function(self, sigIn) {
    function onGet(cb, options) {
        process.nextTick(function() {
            cb(null, self.val);
        });
    }
    var sigOut = rdp.makeSignal(onGet);
    function onSignalUpdate() {
        sigOut.update();
    }
    function onSignalInactive() {
        sigOut.deactivate();
    }
    sigIn.addListener(onSignalUpdate, onSignalInactive);
    return sigOut;
}

//// Pipeline Behavior

/// A pipeline behavior is a chain of two behaviors, with the output
/// signal of the first behavior becoming the input signal of the
/// second.
rdp.BPipe = function BPipe(b1, b2) {
    assert.instanceOf(b1, rdp.Behavior);
    assert.instanceOf(b2, rdp.Behavior);
    this.b1 = b1;
    this.b2 = b2;
}

rdp.BPipe.prototype = new rdp.Behavior();

/// Constructs a pipeline behavior from its one or more argument
/// behaviors.
rdp.bPipe = function(/* b1, ..., bN */) {
    return rdp.bPipeArray(Array.prototype.slice.call(arguments));
}

/// Constructs a pipeline behavior from an array of one or more
/// behaviors.
rdp.bPipeArray = function(bs) {
    return bs.reduce(rdp.bPipe2);
}

/// Constructs a pipeline behavior from two behaviors.
rdp.bPipe2 = function(b1, b2) {
    return new rdp.BPipe(b1, b2);
}

/// As it says on the tin.
rdp.BPipe.prototype.rdpApply = function(self, sigIn) {
    var sigOut1 = rdp.apply(self.b1, sigIn);
    var sigOut2 = rdp.apply(self.b2, sigOut1);
    return sigOut2;
}

//// Map Function Behavior

/// A map behavior applies a function to the value of its input signal
/// and uses the result as the value of its output signal.
rdp.BFMap = function BFMap(fun) {
    assert.isFunction(fun);
    this.fun = fun;
}

rdp.BFMap.prototype = new rdp.Behavior();

/// Creates a new map bevahior with the given function.
rdp.bFMap = function(fun) {
    return new rdp.BFMap(fun);
}

/// Should be obvious by now.
rdp.BFMap.prototype.rdpApply = function(self, sigIn) {
    function onGet(cb, options) {
        sigIn.getValue(function(err, val) {
            if (err) {
                cb(err);
            } else {
                cb(null, self.fun(val));
            }
        });
    }
    var sigOut = rdp.makeSignal(onGet);
    function onSignalUpdate() {
        sigOut.update();
    }
    function onSignalInactive() {
        sigOut.deactivate();
    }
    sigIn.addListener(onSignalUpdate, onSignalInactive);
    return sigOut;
}

