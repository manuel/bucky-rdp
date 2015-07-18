var util = module.exports;
var imm = require("immutable");

util.assertEqual = function(obj1, obj2) {
    if (!imm.is(obj1, obj2)) {
        throw "Expected " + obj1 + " and " + obj2 + " to be equal.";
    }
}
