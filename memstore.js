var memstore = module.exports;
var tdiff = require("./tdiff.js");
var rdp = require("./rdp.js");
var EventEmitter = require("events").EventEmitter;
var imm = require("immutable");
var assert = require("chai").assert;

/// RAM-based store with a one-item history, i.e. it keeps the current
/// state (as a diff/patch), and the last change that led to the
/// current state (also a diff/patch).  History could be extended to
/// remember an arbitrary number of previous changes, but this
/// one-item history nevertheless already demonstrates all relevant
/// concepts.
///
/// Clients can read the contents of the store by getting its bRead
/// behavior and supplying it with an (empty) input signal.  The
/// behavior's output signal delivers the store's contents.  See below
/// for the protocol used internally by clients of signals.
memstore.MemStore = function MemStore() {
    this.currentPatch = tdiff.makeDiff();
    this.version = 0;
    this.lastPatch = null;
    this.emitter = new EventEmitter();
    this.bReadInstance = new memstore.BRead(this);
}

memstore.makeMemStore = function() {
    return new memstore.MemStore();
}

memstore.UPDATE_EVENT = "updateMemStore";

memstore.MemStore.prototype.patch = function(patch) {
    assert.instanceOf(patch, tdiff.Diff);
    this.currentPatch = tdiff.mergeDiffs(this.currentPatch, patch);
    this.version += 1;
    this.lastPatch = patch;
    this.emitter.emit(memstore.UPDATE_EVENT);
}

memstore.MemStore.prototype.bRead = function() {
    return this.bReadInstance;
}

memstore.BRead = function BRead(store) {
    this.store = store;
}

memstore.BRead.prototype = new rdp.Behavior();

//// Read protocol

memstore.BRead.prototype.rdpApply = function(self, sigIn) {
    function doGet(options) {
        if (typeof options.version === "undefined") {
            // No version specified, send current version
            return rdp.makePage(self.store.currentPatch);
        } else {
            if (imm.is(options.version, self.store.version)) {
                // Client-seen version is current version, send nothing
                throw rdp.noContentError();
            } else if (imm.is(options.version, self.store.version - 1)) {
                // Client-seen version is previous version, send last change
                return rdp.makePage(self.store.lastPatch);
            } else {
                // Client requested a diff we cannot serve, send error
                throw rdp.conflictError();
            }
        }
    }
    function onGet(cb, options) {
        var err = null, res = null;
        try {
            res = doGet(options);
        } catch(exc) {
            err = exc;
        } finally {
            /// FIXME: this currently always sends the current version
            /// to the client.  Once more than one history item is
            /// supported, this protocol will need to be changed.
            process.nextTick(function() { cb(err, res, { version: self.store.version }); });
        }
    }
    var sigOut = rdp.makeSignal(onGet);
    function onSignalUpdate() {
        // Kleverly ensure the behavior always only has one listener attached to the store
        self.store.emitter.removeListener(memstore.UPDATE_EVENT, onSignalUpdate);
        self.store.emitter.addListener(memstore.UPDATE_EVENT, onSignalUpdate);
        sigOut.update();
    }
    function onSignalInactive() {
        self.store.emitter.removeListener(memstore.UPDATE_EVENT, onSignalUpdate);
        sigOut.deactivate();
    }
    sigIn.addListener(onSignalUpdate, onSignalInactive);
    return sigOut;
}
