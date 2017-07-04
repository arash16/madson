# madson
[![NPM version](https://img.shields.io/npm/v/madson.svg)](https://www.npmjs.com/package/madson)

madson is a binary serialization library for javascript.

Supports recursive self references.

## Installation

```sh
npm install --save madson
```


## Usage

```javascript
  var madson = require('madson');

  var obj1 = {
    n: 1,
    s: 'string',
    a: [3, {z: 4}],
    r: /av[sx]*/gi,
    d: new Date(),
    o: { p: 1, q: 2, z: false },
    b: true
  };
  JSON.stringify(obj1) // -> string (111 bytes)

  obj1.self = obj1;
  // JSON.stringify(obj1) -> TypeError: Converting circular structure to JSON


  var buf = madson.encode(obj1); // -> Buffer [75 bytes]

  var obj2 = madson.decode(buf);
  // obj1 != obj2
  // obj2.self == obj2
  // obj2.r instanceof RegExp
  // obj2.d instanceof Date
```

### Custom Class Types

```javascript
var madson = require("madson");

var preset = madson.codec.preset;
preset.addExtPacker(0x3F, MyClass, MyClassPacker);
preset.addExtUnpacker(0x3F, MyClassUnpacker);

function MyClass(x, y) {
  this.x = x;
  this.y = y;
}

function MyClassPacker(c) {
  var array = [c.x, c.y];

  // return serialized Buffer
  return madson.encode(array);
}

function MyClassUnpacker(buffer) {
  var array = madson.decode(buffer);

  // return deserialized Object
  return new MyClass(array[0], array[1]);
}


var data = new MyClass(1, 2);
var encoded = madson.encode(data);
console.log(encoded);

var decoded = madson.decode(encoded);
console.log(decoded);
```
