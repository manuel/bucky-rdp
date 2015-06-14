var rdp = module.exports;
var EventEmitter = require("events").EventEmitter;
var chai = require("chai");
var assert = chai.assert;
chai.config.includeStack = true;

//// Signal

rdp.SIGNAL_UPDATE_EVENT = "rdpSignalUpdate";
rdp.SIGNAL_INACTIVE_EVENT = "rdpSignalInactive";

rdp.Signal = function Signal() {
    this.active = false;
    this.val = null;
    this.emitter = new EventEmitter();
}

rdp.makeSignal = function() {
    return new rdp.Signal();
}

rdp.Signal.prototype.getValue = function() {
    assert.isTrue(this.active, "Attempted to get value of inactive signal");
    return this.val;
}

rdp.Signal.prototype.setValue = function(newVal) {
    this.active = true;
    this.val = newVal;
    this.emitSignalUpdate();
}

rdp.Signal.prototype.deactivate = function() {
    if (this.active) {
        this.active = false;
        this.val = null;
        this.emitSignalInactive();
    }
}

rdp.Signal.prototype.isActive = function() {
    return this.active;
}

rdp.Signal.prototype.emitSignalUpdate = function() {
    this.emitter.emit(rdp.SIGNAL_UPDATE_EVENT);
}

rdp.Signal.prototype.emitSignalInactive = function() {
    this.emitter.emit(rdp.SIGNAL_INACTIVE_EVENT);
}

rdp.Signal.prototype.addListener = function(onSignalUpdate, onSignalInactive) {
    assert.isFunction(onSignalUpdate, "onSignalUpdate");
    assert.isFunction(onSignalInactive, "onSignalInactive");
    this.emitter.addListener(rdp.SIGNAL_UPDATE_EVENT, onSignalUpdate);
    this.emitter.addListener(rdp.SIGNAL_INACTIVE_EVENT, onSignalInactive);
}

//// Behavior

rdp.Behavior = function Behavior() {
}

rdp.apply = function(b, sigIn) {
    assert.instanceOf(b, rdp.Behavior);
    assert.instanceOf(sigIn, rdp.Signal);
    assert.isFalse(sigIn.isActive(), "Attemped to apply behavior to already active signal");
    return b.rdpApply(b, sigIn);
}

//// Constant Behavior

rdp.BConst = function BConst(val) {
    this.val = val;
}

rdp.BConst.prototype = new rdp.Behavior();

rdp.bConst = function(val) {
    return new rdp.BConst(val);
}

rdp.BConst.prototype.rdpApply = function(self, sigIn) {
    var sigOut = rdp.makeSignal();
    function onSignalUpdate() {
        sigOut.setValue(self.val);
    }
    function onSignalInactive() {
        sigOut.deactivate();
    }
    sigIn.addListener(onSignalUpdate, onSignalInactive);
    return sigOut;
}

//// Pipeline Behavior

rdp.BPipe = function BPipe(b1, b2) {
    assert.instanceOf(b1, rdp.Behavior);
    assert.instanceOf(b2, rdp.Behavior);
    this.b1 = b1;
    this.b2 = b2;
}

rdp.BPipe.prototype = new rdp.Behavior();

rdp.bPipe = function(/* b1, ..., bN */) {
    return rdp.bPipeArray(Array.prototype.slice.call(arguments));
}

rdp.bPipeArray = function(bs) {
    return bs.reduce(rdp.bPipe2);
}

rdp.bPipe2 = function(b1, b2) {
    return new rdp.BPipe(b1, b2);
}

rdp.BPipe.prototype.rdpApply = function(self, sigIn) {
    var sigOut1 = rdp.apply(self.b1, sigIn);
    var sigOut2 = rdp.apply(self.b2, sigOut1);
    return sigOut2;
}

//// Map Function Behavior

rdp.BFMap = function BFMap(fun) {
    assert.isFunction(fun);
    this.fun = fun;
}

rdp.BFMap.prototype = new rdp.Behavior();

rdp.bFMap = function(fun) {
    return new rdp.BFMap(fun);
}

rdp.BFMap.prototype.rdpApply = function(self, sigIn) {
    var sigOut = rdp.makeSignal();
    function onSignalUpdate() {
        sigOut.setValue(self.fun(sigIn.getValue()));
    }
    function onSignalInactive() {
        sigOut.deactivate();
    }
    sigIn.addListener(onSignalUpdate, onSignalInactive);
    return sigOut;
}
