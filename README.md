# madson
[![NPM version](https://img.shields.io/npm/v/madson.svg)](https://www.npmjs.com/package/madson)

madson is a binary serialization library.

## Installation

```sh
npm install --save madson
```


## Usage

```javascript
  var madson = require('madson');

  var obj1 = { x: 1, y: 2, z: [3, {z: 4}] };
  obj1.self = obj1;

  var buf = madson.encode(obj1); // -> Uint8Array [23 bytes]

  var obj2 = madson.decode(buf);
  // obj1 != obj2
  // obj2.self == obj2
```
