var memstore = module.exports;
var tdiff = require("./tdiff.js");
var rdp = require("./rdp.js");
var EventEmitter = require("events").EventEmitter;

memstore.MemStore = function MemStore() {
    this.currentPatch = tdiff.makeDiff();
    this.version = 0;
    this.lastPatch = null;
    this.emitter = new EventEmitter();
    this.bRead = new memstore.BRead(this);
}

memstore.UPDATE_EVENT = "updateMemStore";

memstore.MemStore.prototype.patch = function(patch) {
    assert.isInstance(patch, tdiff.Diff);
    this.currentPatch = tdiff.merge(this.currentPatch, patch);
    this.version += 1;
    this.lastPatch = patch;
    this.emitter.emit(memstore.UPDATE_EVENT);
}

MEMSTORE.MemStore.prototype.bRead = function() {
    return this.bRead;
}

memstore.BRead = function BRead(store) {
    this.store = store;
}

memstore.BRead.prototype = new rdp.Behavior();

memstore.BRead.prototype.rdpApply = function(self, sigIn) {
    function doGet(options) {
        if (typeof options.version === "undefined") {
            // No version specified, send current version
            return self.store.currentPatch;
        } else {
            if (options.version === self.store.version) {
                // Client-seen version is current version, send nothing
                throw rdp.noContentError();
            } else if (options.version === self.store.version - 1) {
                // Client-seen version is previous version, send last change
                return self.store.lastPatch;
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
            process.nextTick(function() { cb(err, res, { version: self.store.version }); });
        }
    }
    var sigOut = rdp.makeSignal(onGet);
    function onSignalUpdate() {
        self.store.emitter.removeEventListener(memstore.UPDATE_EVENT, onSignalUpdate);
        self.store.emitter.addEventListener(memstore.UPDATE_EVENT, onSignalUpdate);
        sigOut.update();
    }
    function onSignalInactive() {
        self.store.emitter.removeEventListener(memstore.UPDATE_EVENT, onSignalUpdate);
        sigOut.deactivate();
    }
    sigIn.addListener(onSignalUpdate, onSignalInactive);
    return sigOut;
}
