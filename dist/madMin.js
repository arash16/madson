var madMin = function () {
  var global = window || function () {
    return this;
  }.call(null),
      String = global.String,
      Number = global.Number,
      Boolean = global.Boolean,
      Function = global.Function,
      Object = global.Object,
      RegExp = global.RegExp,
      Array = global.Array,
      Error = global.Error,
      Date = global.Date,
      Symbol = global.Symbol,
      ArrayBuffer = global.ArrayBuffer;

  var defineProp = Object.defineProperty,
      defineProps = Object.defineProperties,
      getObjectOwnKeys = Object.getOwnPropertyNames,
      getObjectKeys = Object.keys;

  function hasProp(o, p) {
    return {}.hasOwnProperty.call(o, p);
  }

  function nullObject(proto, d) {
    return Object.create(proto || null, d);
  }

  function isNull(o) {
    return o === null;
  }

  function isUndefined(u) {
    return u === undefined;
  }

  function isVoid(x) {
    return x == null || !x && isNaN(x);
  } // only voids: undefined, null, NaN


  function isBool(b) {
    return typeof b == 'boolean';
  }

  function isString(s) {
    return typeof s == 'string';
  }

  function isNumber(num) {
    return typeof num == 'number';
  }

  function isFunc(f) {
    return typeof f == 'function' && f;
  }

  function isObject(o) {
    return typeof o == 'object' && o;
  }

  function isObjectLike(x) {
    return isFunc(x) || isObject(x);
  }

  function isValue(val) {
    return val ? !isObjectLike(val) : !isVoid(val);
  }

  function isArray(a) {
    return Array.isArray(a) && a;
  }

  function objToString(o) {
    return {}.toString.call(o);
  }

  function isDate(d) {
    return objToString(d) === '[object Date]' && d;
  }

  function isRegExp(re) {
    return objToString(re) === '[object RegExp]' && re;
  }

  function isPromiseLike(obj) {
    return isObjectLike(obj) && isFunc(obj.then);
  }

  function isError(e) {
    return e && (e instanceof Error || objToString(e) === '[object Error]');
  }

  function orDefault(o, d) {
    return isVoid(o) ? d : o;
  }

  function identity(x) {
    return x;
  }

  function nopFunc() {}

  function eachKey(obj, fn, nonEnums, noResult) {
    if (!isObjectLike(obj)) return !noResult && [];
    var keysFn = nonEnums ? getObjectOwnKeys : getObjectKeys;
    return keysFn(obj)[noResult ? 'forEach' : 'map'](function (key) {
      return fn(key, obj[key]);
    });
  }

  function extend(target) {
    var aLen = arguments.length,
        result = isObjectLike(target);

    for (var i = 1; i < aLen; i++) {
      eachKey(arguments[i], function (p, val) {
        result = result || {};
        result[p] = val;
      }, false, true);
    }

    return result;
  }

  function toArray(u) {
    return isArray(u) ? u : isVoid(u) ? [] : [u];
  }

  function applyShim(obj, property, value) {
    if (arguments.length < 3) eachKey(property, function (p, v) {
      return applyShim(obj, p, v);
    });else if (isObjectLike(obj) && !hasProp(obj, property)) defineProp(obj, property, {
      enumerable: true,
      value: value
    });
    return obj;
  }

  var Buffer = function () {
    var p = Buffer.prototype,
        isTypedArray = global.TYPED_ARRAY_SUPPORT;
    if (isUndefined(isTypedArray)) isTypedArray = Buffer.TYPED_ARRAY_SUPPORT = function () {
      try {
        var arr = new Uint8Array(1);

        arr.foo = function () {
          return 42;
        };

        return arr.foo() === 42 && isFunc(arr.subarray) && arr.subarray(1, 1).byteLength === 0;
      } catch (e) {
        return false;
      }
    }();
    var kMaxLength = (Buffer.TYPED_ARRAY_SUPPORT = isTypedArray) ? 0x7fffffff : 0x3fffffff,
        reUtf8 = /^utf\-?8$/i,
        reBin = /^bin(ary)?$/i;

    function checked(length) {
      var len = length | 0;
      if (len >= kMaxLength) throw new RangeError('Maximum Buffer size exceeded: 0x' + kMaxLength.toString(16) + ' bytes');
      return len < 0 ? 0 : len;
    }

    function checkedInd(ind, len) {
      ind = ind | 0;
      len = len | 0;
      ind = ind < 0 ? ind + len : ind > len ? len : ind;
      if (ind < 0) ind = 0;
      return ind;
    }

    function allocate(that, length) {
      if (isTypedArray) return fromArrayBuffer(length);
      that.length = length;
      return that;
    }

    function fromArrayBuffer(array) {
      var buf = new Uint8Array(array);
      buf.__proto__ = p;
      return buf;
    }

    function Buffer(arg, encoding) {
      if (arg == null) throw new TypeError('must start with number, buffer, array or string');
      if (!(this instanceof Buffer)) return new Buffer(arg, encoding);
      if (!isTypedArray) this.length = 0;
      if (isNumber(arg)) return fromNumber(this, arg);
      if (isString(arg)) return fromString(this, arg, isString(encoding) && encoding || 'utf8');
      if (Buffer.isBuffer(arg)) return fromBuffer(this, arg);
      if (isArray(arg) || !global.ArrayBuffer && arg.length || arg.buffer instanceof ArrayBuffer) return fromArray(this, arg); // !ArrayBuffer

      if (arg.length) return fromJsonObject(this, arg);
      if (arg instanceof ArrayBuffer) return isTypedArray ? fromArrayBuffer(arg) : fromArray(this, new Uint8Array(arg));
    }

    function fromNumber(that, length) {
      var len = checked(length),
          buf = allocate(that, len);
      if (!isTypedArray) for (var i = 0; i < len; i++) {
        buf[i] = 0;
      }
      return buf;
    }

    function fromString(that, str, encoding) {
      var buf = allocate(that, Buffer.byteLength(str, encoding) | 0);
      buf.write(str, encoding);
      return buf;
    }

    function fromBuffer(that, buffer) {
      var len = checked(buffer.length) | 0,
          buf = allocate(that, len);
      buffer.copy(buf, 0, 0, len);
      return buf;
    }

    function fromArray(that, array) {
      var len = checked(array.length) | 0,
          buf = allocate(that, len);

      for (var i = 0; i < len; i++) {
        buf[i] = array[i] & 255;
      }

      return buf;
    }

    function fromJsonObject(that, object) {
      var len = 0;

      if (object.type === 'Buffer' && isArray(object.data)) {
        var array = object.data;
        len = checked(array.length) | 0;
      }

      var buf = allocate(that, len);

      for (var i = 0; i < len; i++) {
        buf[i] = array[i] & 255;
      }

      return buf;
    }

    if (isTypedArray) {
      p.__proto__ = Uint8Array.prototype;
      Buffer.__proto__ = Uint8Array;
      if (!isUndefined(Symbol) && Symbol.species && Buffer[Symbol.species] === Buffer) defineProp(Buffer, Symbol.species, {
        value: null,
        configurable: true
      });
    } else p.length = undefined;

    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      var res = [];

      for (var i = start; i < end; i += bytesPerSequence) {
        var codePoint = null,
            firstByte = buf[i],
            bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;
        if (i + bytesPerSequence <= end) switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) codePoint = firstByte;
            break;

          case 2:
            secondByte = buf[i + 1];

            if ((secondByte & 0xC0) === 0x80) {
              var tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
              if (tempCodePoint > 0x7F) codePoint = tempCodePoint;
            }

            break;

          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) codePoint = tempCodePoint;
            }

            break;

          case 4:
            var secondByte = buf[i + 1],
                thirdByte = buf[i + 2],
                fourthByte = buf[i + 3];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) codePoint = tempCodePoint;
            }

        }

        if (isNull(codePoint)) {
          codePoint = 0xFFFD;
          bytesPerSequence = 1;
        } else if (codePoint > 0xFFFF) {
          codePoint -= 0x10000;
          res.push(codePoint >>> 10 & 0x3FF | 0xD800);
          codePoint = 0xDC00 | codePoint & 0x3FF;
        }

        res.push(codePoint);
      }

      return decodeCodePointsArray(res);
    }

    Buffer.isBuffer = function (b) {
      return b != null && (b._isBuffer || b.constructor && b.constructor.isBuffer && b.constructor.isBuffer(b)) && true;
    };

    Buffer.concat = function (list) {
      if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.');
      if (list.length === 0) return new Buffer(0);
      var buf = new Buffer(list.reduce(function (a, b) {
        return a + b.length;
      }, 0));

      for (var i = 0, pos = 0; i < list.length; i++) {
        var item = list[i];
        item.copy(buf, pos);
        pos += item.length;
      }

      return buf;
    };

    Buffer.compare = function (a, b) {
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) throw new TypeError('Arguments must be Buffers');
      if (a === b) return 0;
      var x = a.length,
          y = b.length;

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }

      return x < y ? -1 : x > y ? 1 : 0;
    };

    Buffer.byteLength = function (str) {
      if (!isString(str)) str = '' + str;
      return str.length && utf8ToBytes(str).length;
    };

    extend(p, {
      _isBuffer: true,
      toJSON: function () {
        return {
          type: 'Buffer',
          data: [].slice.call(this._arr || this, 0)
        };
      },
      toString: function (encoding, start, end) {
        var len = this.length | 0;
        if (!len) return '';
        if (!arguments.length) return utf8Slice(this, 0, len);
        start = start | 0;
        if (start < 0) start = 0;
        end = isUndefined(end) || end > this.length ? this.length : end | 0;
        if (end <= start) return '';
        if (!encoding || reUtf8.test(encoding)) return utf8Slice(this, start, end);

        if (reBin.test(encoding)) {
          var ret = '';

          for (var i = start; i < end; i++) {
            ret += String.fromCharCode(this[i]);
          }

          return ret;
        }

        throw new TypeError('Unknown encoding: ' + encoding);
      },
      copy: function (target, targetStart, start, end) {
        start = start | 0;
        end = (end !== 0 && this.length || end) | 0;
        targetStart = (targetStart >= target.length ? target.length : targetStart) | 0;
        if (!target.length || !this.length || end === start || end > 0 && end < start) return 0;
        if (start < 0 || start >= this.length || targetStart < 0 || end < 0) throw new RangeError();
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) end = target.length - targetStart + start;
        var len = end - start | 0;
        if (this === target && start < targetStart && targetStart < end) for (var i = len - 1; i >= 0; i--) {
          target[i + targetStart] = this[i + start];
        } else if (len < 1000 || !isTypedArray) for (i = 0; i < len; i++) {
          target[i + targetStart] = this[i + start];
        } else Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
        return len;
      },
      slice: function (start, end) {
        var len = this.length | 0;
        start = checkedInd(start, len);
        end = isUndefined(end) ? len : checkedInd(end, len);
        end = (end < start ? start : end) | 0;

        if (isTypedArray) {
          newBuf = this.subarray(start, end);
          newBuf.__proto__ = p;
        } else {
          var sliceLen = end - start,
              newBuf = new Buffer(sliceLen);

          for (var i = 0; i < sliceLen; i++) {
            newBuf[i] = this[i + start];
          }
        }

        return newBuf;
      },
      equals: function (b) {
        if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
        return this === b || Buffer.compare(this, b) === 0;
      },
      readUInt8: function (offset) {
        return this[offset];
      },
      readUInt16BE: function (offset) {
        return this[offset] << 8 | this[offset + 1];
      },
      readUInt32BE: function (offset) {
        return 0x1000000 * this[offset] + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      },
      readUInt64BE: function (start) {
        var upper = this.readUInt32BE(start),
            lower = this.readUInt32BE(start + 4);
        return upper ? upper * 4294967296 + lower : lower;
      },
      //
      readInt8: function (offset) {
        return this[offset] & 0x80 ? this[offset] - 0xff - 1 : this[offset];
      },
      readInt16BE: function (offset) {
        var val = this[offset + 1] | this[offset] << 8;
        return val & 0x8000 ? val | 0xFFFF0000 : val;
      },
      readInt32BE: function (offset) {
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      },
      readInt64BE: function (start) {
        var upper = this.readInt32BE(start),
            lower = this.readUInt32BE(start + 4);
        return upper ? upper * 4294967296 + lower : lower;
      },
      //
      readDoubleBE: function (offset) {
        return ieee754read(this, offset, false, 52, 8);
      },
      readFloatBE: function (offset) {
        return ieee754read(this, offset, false, 23, 4);
      },
      readString: function (start, end) {
        var buffer = this,
            index = start - 0 || 0;
        if (!end) end = buffer.length;
        var size = end - start;
        if (size > kMaxLength) size = kMaxLength;

        for (var out = []; index < end;) {
          var array = new Array(size);

          for (var pos = 0; pos < size && index < end; array[pos++] = chr) {
            var chr = buffer[index++];
            chr = chr < 0x80 ? chr : chr < 0xE0 ? (chr & 0x3F) << 6 | buffer[index++] & 0x3F : (chr & 0x3F) << 12 | (buffer[index++] & 0x3F) << 6 | buffer[index++] & 0x3F;
          }

          if (pos < size) array = array.slice(0, pos);
          out.push(String.fromCharCode.apply('', array));
        }

        return out.length > 1 ? out.join('') : out.length ? out.shift() : '';
      },
      writeString: function (str, start) {
        var buffer = this,
            index = start | 0;

        for (var i = 0, len = str.length; i < len; i++) {
          var chr = str.charCodeAt(i);
          if (chr < 0x80) buffer[index++] = chr;else if (chr < 0x800) {
            buffer[index++] = 0xC0 | chr >> 6;
            buffer[index++] = 0x80 | chr & 0x3F;
          } else {
            buffer[index++] = 0xE0 | chr >> 12;
            buffer[index++] = 0x80 | chr >> 6 & 0x3F;
            buffer[index++] = 0x80 | chr & 0x3F;
          }
        }

        return index - start;
      },
      write: function (str, offset, length, encoding) {
        if (isUndefined(offset)) {
          encoding = 'utf8';
          length = this.length;
          offset = 0;
        } else if (isUndefined(length) && isString(offset)) {
          encoding = offset;
          length = this.length;
          offset = 0;
        } else if (isFinite(offset)) {
          offset = offset | 0;
          if (isFinite(length)) length = length | 0;else {
            encoding = length;
            length = undefined;
          }
        } else {
          var swap = encoding;
          encoding = offset;
          offset = length | 0;
          length = swap;
        }

        var remaining = this.length - offset;
        if (isUndefined(length) || length > remaining) length = remaining;
        if (str.length > 0 && (length < 0 || offset < 0) || offset > this.length) throw new RangeError('attempt to write outside buffer bounds');
        if (!encoding || reUtf8.test(encoding)) return blitBuffer(utf8ToBytes(str, this.length - offset), this, offset, length);
        if (reBin.test(encoding)) return blitBuffer(asciiToBytes(str), this, offset, length);
        throw new TypeError('Unknown encoding: ' + encoding);
      },
      writeUInt8: function (value, offset) {
        if (!isTypedArray) value = Math.floor(value);
        this[offset = offset | 0] = value & 0xff;
        return offset + 1;
      },
      writeUInt16BE: function (value, offset) {
        offset = offset | 0;

        if (isTypedArray) {
          this[offset] = value >>> 8;
          this[offset + 1] = value & 0xff;
        } else {
          if (value < 0) value = 0xffff + value + 1;

          for (var i = 0, j = Math.min(this.length - offset, 2); i < j; i++) {
            var shiftLen = 8 * (1 - i);
            this[offset + i] = (value & 0xff << shiftLen) >>> shiftLen;
          }
        }

        return offset + 2;
      },
      writeUInt32BE: function (value, offset) {
        offset = offset | 0;

        if (isTypedArray) {
          this[offset] = value >>> 24;
          this[offset + 1] = value >>> 16;
          this[offset + 2] = value >>> 8;
          this[offset + 3] = value & 0xff;
        } else {
          if (value < 0) value = 0xffffffff + value + 1;

          for (var i = 0, j = Math.min(this.length - offset, 4); i < j; i++) {
            this[offset + i] = value >>> (3 - i) * 8 & 0xff;
          }
        }

        return offset + 4;
      },
      writeUInt64BE: function (value, offset) {
        for (var i = 7; i >= 0; i--, value >>= 8) {
          this[offset + i] = value & 0xFF;
        }

        return offset + 8;
      },
      //
      writeInt8: function (value, offset) {
        if (!isTypedArray) value = Math.floor(value);
        this[offset = offset | 0] = toUnsigned(value, 8);
        return offset + 1;
      },
      writeInt16BE: function (value, offset) {
        return this.writeUInt16BE(toUnsigned(value, 16), offset);
      },
      writeInt32BE: function (value, offset) {
        return this.writeUInt32BE(toUnsigned(value, 32), offset);
      },
      writeFloatBE: function (value, offset) {
        return ieee754write(this, value, offset = offset | 0, false, 23, 4);
      },
      writeDoubleBE: function (value, offset) {
        return ieee754write(this, value, offset = offset | 0, false, 52, 8);
      }
    });
    var masks = [0xff, 0xffff, 0xffffff, 0xffffffff];

    function toUnsigned(value, bitsLen) {
      var mask = masks[(bitsLen >> 3) - 1],
          result = value & mask;
      return result < 0 ? result + mask + 1 : result;
    }

    function asciiToBytes(str) {
      var byteArray = [];

      for (var i = 0; i < str.length; i++) {
        byteArray.push(str.charCodeAt(i) & 0xFF);
      }

      return byteArray;
    }

    function utf8ToBytes(str, units) {
      units = units || Infinity;
      var length = str.length,
          leadSurrogate = null,
          bytes = [];

      for (var i = 0; i < length; i++) {
        var codePoint = str.charCodeAt(i);

        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          if (!leadSurrogate) {
            if (codePoint > 0xDBFF) {
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            } else if (i + 1 === length) {
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            } else leadSurrogate = codePoint;

            continue;
          }

          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            leadSurrogate = codePoint;
            continue;
          }

          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate && (units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);

        leadSurrogate = null;

        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break;
          bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break;
          bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break;
          bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
        } else throw new Error('Invalid code point');
      }

      return bytes;
    }

    function blitBuffer(src, dst, offset, length) {
      for (var i = 0; i < length && i + offset < dst.length && i < src.length; i++) {
        dst[i + offset] = src[i];
      }

      return i;
    }

    var gb = global.Buffer;
    if (!gb) return Buffer;

    for (var key in p) {
      if (!gb.prototype[key]) gb.prototype[key] = p[key];
    }

    for (var key in Buffer) {
      if (!gb[key]) gb[key] = Buffer[key];
    }

    return gb;
  }();

  function ieee754read(buffer, offset, isLE, mLen, nBytes) {
    var eLen = nBytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        nBits = -7,
        d = isLE ? -1 : 1,
        i = (isLE ? nBytes - 1 : 0) + d,
        s = buffer[offset + i - d];
    var e = s & (1 << -nBits) - 1;
    s >>= -nBits;

    for (nBits += eLen; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    var m = e & (1 << -nBits) - 1;
    e >>= -nBits;

    for (nBits += mLen; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) e = 1 - eBias;else if (e === eMax) return m ? NaN : (s ? -1 : 1) * Infinity;else {
      m += Math.pow(2, mLen);
      e -= eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  }

  function ieee754write(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);

      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }

      if (e + eBias >= 1) value += rt / c;else value += rt * Math.pow(2, 1 - eBias);

      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = e << mLen | m;
    eLen += mLen;

    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
    return offset + nBytes;
  }

  function ObjectRef(id) {
    this.$ref = parseInt(id);
  }

  function cloneDecycle(object) {
    var ID_FIELD = '__:D',
        fin = [];

    var result = function decycle(value) {
      if (isFunc(value)) return;
      if (!value || !isObject(value) || preset.getExtPacker(value)) return value;
      if (value[ID_FIELD]) return new ObjectRef(value[ID_FIELD]);
      value[ID_FIELD] = fin.push(value);
      if (Buffer.isBuffer(value)) return value;

      if (isArray(value)) {
        var result = new Array(value.length);

        for (var i = 0; i < value.length; i++) {
          if (!isUndefined(value[i])) result[i] = decycle(value[i]);
        }

        return result;
      }

      var result = {};
      eachKey(value, function (k, v) {
        if (k !== ID_FIELD) result[k] = decycle(v);
      });
      return result;
    }(object);

    fin.forEach(function (obj) {
      delete obj[ID_FIELD];
    });
    return result;
  }

  function retroCycle(object) {
    var fin = [];
    return function recycle(value) {
      if (!value || !isObject(value)) return value;
      if (value instanceof ObjectRef) return fin[value.$ref - 1];
      fin.push(value);
      if (!Buffer.isBuffer(value)) if (isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          if (!isUndefined(value[i])) value[i] = recycle(value[i]);
        }
      } else eachKey(value, function (k, v) {
        return value[k] = recycle(v);
      });
      return value;
    }(object);
  }

  var MIN_BUFFER_SIZE = 2048;
  var MAX_BUFFER_SIZE = 65536;

  function EncodeBuffer(options) {
    this.codec = options && options.codec || preset;
    this.buffers = [];
    this.buffer = null;
    this.offset = 0;
    this.start = 0;
  }

  EncodeBuffer.prototype = {
    push: function (chunk) {
      this.buffers.push(chunk);
    },
    read: function () {
      this.flush();
      var chunk = this.buffers.length > 1 ? Buffer.concat(this.buffers) : this.buffers[0];
      this.buffers.length = 0;
      return chunk;
    },
    flush: function () {
      if (this.start < this.offset) {
        this.push(this.buffer.slice(this.start, this.offset));
        this.start = this.offset;
      }
    },
    reserve: function (length) {
      if (!this.buffer) return this.alloc(length);
      var size = this.buffer.length;
      if (this.offset + length < size) return;
      if (this.offset) this.flush();
      this.alloc(Math.max(length, Math.min(size * 2, MAX_BUFFER_SIZE)));
    },
    alloc: function (length) {
      this.buffer = new Buffer(length > MIN_BUFFER_SIZE ? length : MIN_BUFFER_SIZE);
      this.offset = 0;
      this.start = 0;
    },
    send: function (buffer) {
      var end = this.offset + buffer.length;

      if (this.buffer && end < this.buffer.length) {
        buffer.copy(this.buffer, this.offset);
        this.offset = end;
      } else {
        this.flush();
        this.push(buffer);
      }
    }
  };

  function DecodeBuffer(options) {
    this.codec = options && options.codec || preset;
    this.buffer = null;
    this.offset = 0;
  }

  DecodeBuffer.prototype = {
    push: Array.prototype.push,
    read: Array.prototype.shift,
    append: function (chunk) {
      var prev = this.offset ? this.buffer.slice(this.offset) : this.buffer;
      this.buffer = prev ? Buffer.concat([prev, chunk]) : chunk;
      this.offset = 0;
    }
  };

  function ExtBuffer(buffer, type) {
    this.buffer = buffer;
    this.type = type;
  }

  var BUFFER_SHORTAGE = new Error("BUFFER_SHORTAGE"),
      IS_BUFFER_SHIM = "TYPED_ARRAY_SUPPORT" in Buffer,
      NO_TYPED_ARRAY = IS_BUFFER_SHIM && !Buffer.TYPED_ARRAY_SUPPORT;

  var encode = function () {
    var type = function () {
      var extMap = [];

      for (var i = 0; i < 5; i++) {
        extMap[1 << i] = 0xd4 + i;
      }

      function nil(encoder, value) {
        token[0xc0](encoder, value);
      }

      function array(encoder, value) {
        var length = value.length,
            type = length < 16 ? 0x90 + length : length <= 0xFFFF ? 0xdc : 0xdd;
        token[type](encoder, length);

        for (var i = 0; i < length; i++) {
          encode(encoder, value[i]);
        }
      }

      function bin(encoder, value) {
        var length = value.length,
            type = length < 0xFF ? 0xc4 : length <= 0xFFFF ? 0xc5 : 0xc6;
        token[type](encoder, length);
        encoder.send(value);
      }

      function ext(encoder, value) {
        var buffer = value.buffer,
            length = buffer.length,
            type = extMap[length] || (length < 0xFF ? 0xc7 : length <= 0xFFFF ? 0xc8 : 0xc9);
        token[type](encoder, length);
        uint8[value.type](encoder);
        encoder.send(buffer);
      }

      function map(encoder, value) {
        var keys = Object.keys(value),
            length = keys.length,
            type = length < 16 ? 0x80 + length : length <= 0xFFFF ? 0xde : 0xdf;
        token[type](encoder, length);
        keys.forEach(function (key) {
          encode(encoder, key);
          encode(encoder, value[key]);
        });
      }

      return {
        'boolean': function (encoder, value) {
          token[value ? 0xc3 : 0xc2](encoder, value);
        },
        'number': function (encoder, value) {
          var ivalue = value | 0,
              type;
          if (value !== ivalue) return void token[0xcb](encoder, value);
          if (-0x20 <= ivalue && ivalue <= 0x7F) type = ivalue & 0xFF;else if (0 <= ivalue) type = ivalue <= 0xFF ? 0xcc : ivalue <= 0xFFFF ? 0xcd : 0xce;else type = -0x80 <= ivalue ? 0xd0 : -0x8000 <= ivalue ? 0xd1 : 0xd2;
          token[type](encoder, ivalue);
        },
        'string': function (encoder, value) {
          var length = value.length,
              maxsize = 5 + length * 3;
          encoder.reserve(maxsize);
          var expected = length < 32 ? 1 : length <= 0xFF ? 2 : length <= 0xFFFF ? 3 : 5,
              start = encoder.offset + expected;
          length = encoder.buffer.writeString(value, start);
          var actual = length < 32 ? 1 : length <= 0xFF ? 2 : length <= 0xFFFF ? 3 : 5;

          if (expected !== actual) {
            var targetStart = encoder.offset + actual,
                end = start + length;
            encoder.buffer.copy(encoder.buffer, targetStart, start, end);
          }

          var type = actual === 1 ? 0xa0 + length : actual <= 3 ? 0xd7 + actual : 0xdb;
          token[type](encoder, length);
          encoder.offset += length;
        },
        'object': function (encoder, value) {
          if (isArray(value)) return array(encoder, value);
          if (value === null) return nil(encoder, value);
          if (Buffer.isBuffer(value)) return bin(encoder, value);
          var packer = encoder.codec.getExtPacker(value);
          if (packer) value = packer(value);
          if (value instanceof ExtBuffer) return ext(encoder, value);
          map(encoder, value);
        },
        'function': nil,
        'symbol': nil,
        'undefined': nil
      };
    }();

    var token = new Array(256),
        uint8 = new Array(256);
    if (NO_TYPED_ARRAY) init_tokens(writeN, writeN, writeN);else init_tokens(write1, write2, write4);

    function init_tokens(write1, write2, write4) {
      var p = Buffer.prototype;

      for (var i = 0x00; i <= 0xFF; i++) {
        token[i] = uint8[i] = write0(i);
      }

      [0xc4, 0xc7, 0xcc, 0xd9].forEach(function (c) {
        token[c] = write1(c, 1, p.writeUInt8);
      });
      [0xc5, 0xc8, 0xcd, 0xda, 0xdc, 0xde].forEach(function (c) {
        token[c] = write2(c, 2, p.writeUInt16BE);
      });
      [0xc6, 0xc9, 0xce, 0xdb, 0xdd, 0xdf].forEach(function (c) {
        token[c] = write4(c, 4, p.writeUInt32BE);
      });
      token[0xd0] = write1(0xd0, 1, p.writeInt8);
      token[0xd1] = write2(0xd1, 2, p.writeInt16BE);
      token[0xd2] = write4(0xd2, 4, p.writeInt32BE);
      token[0xca] = writeN(0xca, 4, p.writeFloatBE);
      token[0xcb] = writeN(0xcb, 8, p.writeDoubleBE);
      token[0xcf] = writeN(0xcf, 8, p.writeUInt64BE);
      token[0xd3] = writeN(0xd3, 8, p.writeUInt64BE);
    }

    function writeN(type, len, method) {
      return function (encoder, value) {
        encoder.reserve(len + 1);
        encoder.buffer[encoder.offset++] = type;
        method.call(encoder.buffer, value, encoder.offset);
        encoder.offset += len;
      };
    }

    function write4(type) {
      return function (encoder, value) {
        encoder.reserve(5);
        var buffer = encoder.buffer,
            offset = encoder.offset;
        buffer[offset++] = type;
        buffer[offset++] = value >>> 24;
        buffer[offset++] = value >>> 16;
        buffer[offset++] = value >>> 8;
        buffer[offset++] = value;
        encoder.offset = offset;
      };
    }

    function write2(type) {
      return function (encoder, value) {
        encoder.reserve(3);
        var buffer = encoder.buffer,
            offset = encoder.offset;
        buffer[offset++] = type;
        buffer[offset++] = value >>> 8;
        buffer[offset++] = value;
        encoder.offset = offset;
      };
    }

    function write1(type) {
      return function (encoder, value) {
        encoder.reserve(2);
        var buffer = encoder.buffer,
            offset = encoder.offset;
        buffer[offset++] = type;
        buffer[offset++] = value;
        encoder.offset = offset;
      };
    }

    function write0(type) {
      return function (encoder) {
        encoder.reserve(1);
        encoder.buffer[encoder.offset++] = type;
      };
    }

    return function (encoder, value) {
      var func = type[typeof value];
      if (!func) throw new Error("Unsupported type \"" + typeof value + "\": " + value);
      func(encoder, value);
    };
  }();

  var decode = function () {
    var format = function () {
      function read(len, method) {
        return function (decoder) {
          var start = decoder.offset,
              end = decoder.offset = start + len;
          if (end > decoder.buffer.length) throw BUFFER_SHORTAGE;
          return method.call(decoder.buffer, start);
        };
      }

      var p = Buffer.prototype;
      return {
        array: function (decoder, len) {
          var value = new Array(len);

          for (var i = 0; i < len; i++) {
            value[i] = decode(decoder);
          }

          return value;
        },
        map: function (decoder, len) {
          var value = {};

          for (var i = 0; i < len; i++) {
            var key = decode(decoder);
            value[key] = decode(decoder);
          }

          return value;
        },
        str: function (decoder, len) {
          var buffer = decoder.buffer,
              start = decoder.offset,
              end = decoder.offset = start + len;
          if (end > buffer.length) throw BUFFER_SHORTAGE;
          return IS_BUFFER_SHIM || !Buffer.isBuffer(buffer) ? buffer.readString(start, end) : buffer.toString("utf-8", start, end);
        },
        bin: function (decoder, len) {
          var start = decoder.offset,
              end = decoder.offset = start + len;
          if (end > decoder.buffer.length) throw BUFFER_SHORTAGE;
          return decoder.buffer.slice(start, end);
        },
        ext: function (decoder, len) {
          var start = decoder.offset,
              end = decoder.offset = start + len + 1;
          if (end > decoder.buffer.length) throw BUFFER_SHORTAGE;
          var type = decoder.buffer[start],
              unpack = decoder.codec.getExtUnpacker(type);
          if (!unpack) throw new Error("Invalid ext type: " + (type && "0x" + type.toString(16)));
          return unpack(decoder.buffer.slice(start + 1, end));
        },
        uint8: read(1, p.readUInt8),
        uint16: read(2, p.readUInt16BE),
        uint32: read(4, p.readUInt32BE),
        uint64: read(8, p.readUInt64BE),
        int8: read(1, p.readInt8),
        int16: read(2, p.readInt16BE),
        int32: read(4, p.readInt32BE),
        int64: read(8, p.readInt64BE),
        float32: read(4, p.readFloatBE),
        float64: read(8, p.readDoubleBE)
      };
    }();

    var token = function (token) {
      for (var i = 0x00; i <= 0x7f; i++) {
        token[i] = constant(i);
      }

      for (i = 0x80; i <= 0x8f; i++) {
        token[i] = fix(i - 0x80, format.map);
      }

      for (i = 0x90; i <= 0x9f; i++) {
        token[i] = fix(i - 0x90, format.array);
      }

      for (i = 0xa0; i <= 0xbf; i++) {
        token[i] = fix(i - 0xa0, format.str);
      }

      [constant(null), null, constant(false), constant(true), flex(format.uint8, format.bin), flex(format.uint16, format.bin), flex(format.uint32, format.bin), flex(format.uint8, format.ext), flex(format.uint16, format.ext), flex(format.uint32, format.ext), format.float32, format.float64, format.uint8, format.uint16, format.uint32, format.uint64, format.int8, format.int16, format.int32, format.int64, fix(1, format.ext), fix(2, format.ext), fix(4, format.ext), fix(8, format.ext), fix(16, format.ext), flex(format.uint8, format.str), flex(format.uint16, format.str), flex(format.uint32, format.str), flex(format.uint16, format.array), flex(format.uint32, format.array), flex(format.uint16, format.map), flex(format.uint16, format.map)].forEach(function (t, i) {
        return token[0xc0 + i] = t;
      });

      for (i = 0xe0; i <= 0xff; i++) {
        token[i] = constant(i - 0x100);
      }

      function constant(value) {
        return function () {
          return value;
        };
      }

      function flex(lenFunc, decodeFunc) {
        return function (decoder) {
          return decodeFunc(decoder, lenFunc(decoder));
        };
      }

      function fix(len, method) {
        return function (decoder) {
          return method(decoder, len);
        };
      }

      return token;
    }(new Array(256));

    return function (decoder) {
      var type = format.uint8(decoder);
      if (!token[type]) throw new Error("Invalid type: " + (type ? "0x" + type.toString(16) : type));
      return token[type](decoder);
    };
  }();

  var createCodec = function () {
    function Ext() {
      this.extEncoderList = [];
      this.extUnpackers = [];
      this.extPackers = {};
    }

    Ext.prototype = {
      addExtPacker: function (etype, Class, packer) {
        if (isArray(packer)) packer = join(packer);
        var name = Class.name;
        if (name && name !== "Object") this.extPackers[name] = extPacker;else this.extEncoderList.unshift([Class, extPacker]);

        function extPacker(value) {
          return new ExtBuffer(packer(value), etype);
        }
      },
      addExtUnpacker: function (etype, unpacker) {
        this.extUnpackers[etype] = isArray(unpacker) ? join(unpacker) : unpacker;
      },
      getExtPacker: function (value) {
        var c = value.constructor,
            e = c && c.name && this.extPackers[c.name];
        if (e) return e;

        for (var i = 0, pair; pair = this.extEncoderList[i]; i++) {
          if (c === pair[0]) return pair[1];
        }
      },
      getExtUnpacker: function (type) {
        return this.extUnpackers[type] || function (buffer) {
          return new ExtBuffer(buffer, type);
        };
      }
    };

    function join(filters) {
      var f = filters.slice();
      return function (value) {
        return f.reduce(function (v, f) {
          return f(v);
        }, value);
      };
    }

    return function () {
      return new Ext();
    };
  }();

  var preset = function (preset) {
    var last;
    var ERROR_COLUMNS = 'name message stack columnNumber fileName lineNumber'.split(' ');

    function unpackError(Class) {
      return function (value) {
        var out = new Class(value.message);

        for (var i = 0, key; key = ERROR_COLUMNS[i]; i++) {
          if (value[key]) out[key] = value[key];
        }

        return out;
      };
    }

    function unpackClass(Class) {
      return function (value) {
        return new Class(value);
      };
    }

    function packArrayBuffer(value) {
      return new Buffer(new Uint8Array(value));
    }

    function unpackArrayBuffer(value) {
      return new Uint8Array(value).buffer;
    }

    function packTypedArray(value) {
      return new Buffer(new Uint8Array(value.buffer));
    }

    function packBuffer(value) {
      return new Buffer(value);
    }

    [[0x0E, Error, unpackError(Error), function (value) {
      var out = {};

      for (var i = 0, key; key = ERROR_COLUMNS[i]; i++) {
        if (value[key]) out[key] = value[key];
      }

      return out;
    }], [0x01, EvalError, unpackError(EvalError)], [0x02, RangeError, unpackError(RangeError)], [0x03, ReferenceError, unpackError(ReferenceError)], [0x04, SyntaxError, unpackError(SyntaxError)], [0x05, TypeError, unpackError(TypeError)], [0x06, URIError, unpackError(URIError)], [0x0B, Boolean, unpackClass(Boolean), function (value) {
      return value.valueOf();
    }], [0x0C, String, unpackClass(String)], [0x0F, Number, unpackClass(Number)], [0x0D, Date, unpackClass(Date), Number], [0x0A, RegExp, function (value) {
      return RegExp.apply(null, value);
    }, function (value) {
      value = RegExp.prototype.toString.call(value).split('/');
      value.shift();
      var out = [value.pop()];
      out.unshift(value.join('/'));
      return out;
    }], [0x3F, ObjectRef, unpackClass(ObjectRef), function (v) {
      return v.$ref;
    }]].forEach(function (ext) {
      preset.addExtPacker(ext[0], ext[1], [last = ext[3] || last, mEncode]);
      preset.addExtUnpacker(ext[0], [mDecode, ext[2]]);
    });

    if (typeof Uint8Array !== 'undefined') {
      [[0x1A, ArrayBuffer, unpackArrayBuffer, packArrayBuffer], [0x11, Int8Array, unpackClass(Int8Array), packBuffer], [0x12, Uint8Array, unpackClass(Uint8Array)], [0x13, Int16Array, 0, packTypedArray], [0x15, Int32Array], [0x14, Uint16Array], [0x16, Uint32Array], [0x17, Float32Array], [0x1D, DataView]].forEach(function (ext) {
        preset.addExtPacker(ext[0], ext[1], last = ext[3] || last);
        preset.addExtUnpacker(ext[0], ext[2] || [unpackArrayBuffer, unpackClass(ext[1])]);
      });

      if (typeof Float64Array !== 'undefined') {
        preset.addExtPacker(0x18, Float64Array, packTypedArray);
        preset.addExtUnpacker(0x18, [unpackArrayBuffer, unpackClass(Float64Array)]);
      }

      if (typeof Uint8ClampedArray !== 'undefined') {
        preset.addExtPacker(0x19, Uint8ClampedArray, packBuffer);
        preset.addExtUnpacker(0x19, unpackClass(Uint8ClampedArray));
      }
    }

    return preset;
  }(createCodec());

  function mEncode(input, options) {
    var encoder = new EncodeBuffer(options);
    encode(encoder, cloneDecycle(input));
    return encoder.read();
  }

  function mDecode(input, options) {
    var decoder = new DecodeBuffer(options);
    decoder.append(input);
    return retroCycle(decode(decoder));
  }

  return extend(function (input) {
    return Buffer.isBuffer(input) ? mDecode(input) : mEncode(input);
  }, {
    createCodec: createCodec,
    codec: {
      preset: preset
    },
    encode: mEncode,
    decode: mDecode
  });
}(); //if ("isServer")


if (typeof module == 'object') module.exports = madMin;

//# sourceMappingURL=madMin.js.map