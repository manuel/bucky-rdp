[![Build Status](https://travis-ci.org/manuel/bucky-rdp.svg?branch=master)](https://travis-ci.org/manuel/bucky-rdp)

A trivial implementation of Reactive Demand Programming
for Node.js and Browserify.

Supports the following behaviors:

## rdp.bConst

`rdp.bConst(value)`

While its input signal is active, produces an unchanging value as its
output signal.  Ignores the actual value of the input signal.

## rdp.bPipe

`rdp.bPipe(b1, ..., bN)`

A chain of one or more behaviors.

## rdp.bFMap

`rdp.bFMap(function)`

A behavior that applies a function to the value of its input signal,
and uses the result as the value of its output signal.

## Example

````javascript
var rdp = require("bucky-rdp");

// Create some behaviors for transforming numbers.
var bDouble = rdp.bFMap(function(val) { return val * 2; });
var bMinusOne = rdp.bFMap(function(val) { return val - 1; });

// Create a pipeline behavior of the two behaviors
var myBehavior = rdp.bPipe(bDouble, bMinusOne);

// Apply an inactive input signal to the pipeline behavior
var sigIn = rdp.makeSignal();
var sigOut = rdp.apply(myBehavior, sigIn);

// Change the input signal value and watch the output signal change
sigIn.setValue(2);
console.log(sigOut.getValue()); // Prints 3
sigIn.setValue(4);
console.log(sigOut.getValue()); // Prints 7
sigIn.deactivate();
````

## License

MIT
