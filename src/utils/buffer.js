var Buffer = (function () {
    var p = Buffer.prototype,
        isTypedArray = global.TYPED_ARRAY_SUPPORT;
    if (isUndefined(isTypedArray)) isTypedArray = Buffer.TYPED_ARRAY_SUPPORT = (function () {
        try {
            var arr = new Uint8Array(1)
            arr.foo = function () { return 42; };
            return arr.foo() === 42 && isFunc(arr.subarray) && arr.subarray(1, 1).byteLength === 0;
        } catch (e) {
            return false;
        }
    })();

    var kMaxLength = (Buffer.TYPED_ARRAY_SUPPORT = isTypedArray) ? 0x7fffffff : 0x3fffffff,
        reUtf8 = /^utf\-?8$/i,
        reBin = /^bin(ary)?$/i;


    function checked(length) {
        var len = length | 0;
        if (len >= kMaxLength)
            throw new RangeError('Maximum Buffer size exceeded: 0x' + kMaxLength.toString(16) + ' bytes');
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
        if (isTypedArray)
            return fromArrayBuffer(length);

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

        if (isArray(arg) || (!global.ArrayBuffer && arg.length) || arg.buffer instanceof ArrayBuffer)
            return fromArray(this, arg);

        // !ArrayBuffer
        if (arg.length) return fromJsonObject(this, arg);
        if (arg instanceof ArrayBuffer)
            return isTypedArray ? fromArrayBuffer(arg)
                : fromArray(this, new Uint8Array(arg));
    }

    function fromNumber(that, length) {
        var len = checked(length),
            buf = allocate(that, len);
        if (!isTypedArray)
            for (var i = 0; i < len; i++)
                buf[i] = 0;
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
        for (var i = 0; i < len; i++)
            buf[i] = array[i] & 255;
        return buf;
    }

    function fromJsonObject(that, object) {
        var len = 0;
        if (object.type === 'Buffer' && isArray(object.data)) {
            var array = object.data;
            len = checked(array.length) | 0;
        }

        var buf = allocate(that, len);
        for (var i = 0; i < len; i++)
            buf[i] = array[i] & 255;

        return buf;
    }

    if (isTypedArray) {
        p.__proto__ = Uint8Array.prototype;
        Buffer.__proto__ = Uint8Array;
        if (!isUndefined(Symbol) && Symbol.species && Buffer[Symbol.species] === Buffer)
            defineProp(Buffer, Symbol.species, { value: null, configurable: true });
    }
    else p.length = undefined;


    function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        var res = [];

        for (var i = start; i < end; i += bytesPerSequence) {
            var codePoint = null,
                firstByte = buf[i],
                bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1

            if (i + bytesPerSequence <= end)
                switch (bytesPerSequence) {
                    case 1:
                        if (firstByte < 0x80) codePoint = firstByte;
                        break;
                    case 2:
                        secondByte = buf[i + 1];
                        if ((secondByte & 0xC0) === 0x80) {
                            var tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                            if (tempCodePoint > 0x7F)
                                codePoint = tempCodePoint;
                        }
                        break;
                    case 3:
                        secondByte = buf[i + 1];
                        thirdByte = buf[i + 2];
                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF))
                                codePoint = tempCodePoint;
                        }
                        break;
                    case 4:
                        var secondByte = buf[i + 1],
                            thirdByte = buf[i + 2],
                            fourthByte = buf[i + 3];

                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0xF) << 0x12 |
                                (secondByte & 0x3F) << 0xC |
                                (thirdByte & 0x3F) << 0x6 |
                                (fourthByte & 0x3F);

                            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000)
                                codePoint = tempCodePoint;
                        }
                }

            if (isNull(codePoint)) {
                codePoint = 0xFFFD;
                bytesPerSequence = 1;
            }
            else if (codePoint > 0xFFFF) {
                codePoint -= 0x10000;
                res.push(codePoint >>> 10 & 0x3FF | 0xD800);
                codePoint = 0xDC00 | codePoint & 0x3FF;
            }

            res.push(codePoint);
        }

        return decodeCodePointsArray(res);
    }


    Buffer.isBuffer = function (b) {
        return b != null && (b._isBuffer || (b.constructor && b.constructor.isBuffer && b.constructor.isBuffer(b))) && true;
    };
    Buffer.concat = function (list) {
        if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.');
        if (list.length === 0) return new Buffer(0);

        var buf = new Buffer(list.reduce(((a, b) => a + b.length), 0));
        for (var i = 0, pos = 0; i < list.length; i++) {
            var item = list[i];
            item.copy(buf, pos);
            pos += item.length;
        }
        return buf;
    };
    Buffer.compare = function (a, b) {
        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
            throw new TypeError('Arguments must be Buffers')

        if (a === b) return 0;

        var x = a.length, y = b.length;
        for (var i = 0, len = Math.min(x, y); i < len; ++i)
            if (a[i] !== b[i]) {
                x = a[i];
                y = b[i];
                break;
            }

        return x < y ? -1 : x > y ? 1 : 0;
    };
    Buffer.byteLength = function (str, encoding) {
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

            if (!encoding || reUtf8.test(encoding))
                return utf8Slice(this, start, end);

            if (reBin.test(encoding)) {
                var ret = '';
                for (var i = start; i < end; i++)
                    ret += String.fromCharCode(this[i]);
                return ret;
            }

            throw new TypeError('Unknown encoding: ' + encoding);
        },
        copy: function (target, targetStart, start, end) {
            start = start | 0;
            end = (end !== 0 && this.length || end) | 0;

            targetStart = (targetStart >= target.length ? target.length : targetStart) | 0;
            if (!target.length || !this.length || end === start || (end > 0 && end < start)) return 0;

            if (start < 0 || start >= this.length || targetStart < 0 || end < 0)
                throw new RangeError();

            if (end > this.length) end = this.length;
            if (target.length - targetStart < end - start)
                end = target.length - targetStart + start;

            var len = (end - start) | 0;
            if (this === target && start < targetStart && targetStart < end)
                for (var i = len - 1; i >= 0; i--)
                    target[i + targetStart] = this[i + start];

            else if (len < 1000 || !isTypedArray)
                for (i = 0; i < len; i++)
                    target[i + targetStart] = this[i + start];

            else Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);

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
            }
            else {
                var sliceLen = end - start,
                    newBuf = new Buffer(sliceLen);

                for (var i = 0; i < sliceLen; i++)
                    newBuf[i] = this[i + start];
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
            return (this[offset] << 8) | this[offset + 1];
        },
        readUInt32BE: function (offset) {
            return 0x1000000 * this[offset] + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
        },
        readUInt64BE: function (start) {
            var upper = this.readUInt32BE(start),
                lower = this.readUInt32BE(start + 4);
            return upper ? upper * 4294967296 + lower : lower;
        }, //

        readInt8: function (offset) {
            return this[offset] & 0x80 ? this[offset] - 0xff - 1 : this[offset];
        },
        readInt16BE: function (offset) {
            var val = this[offset + 1] | (this[offset] << 8);
            return val & 0x8000 ? val | 0xFFFF0000 : val;
        },
        readInt32BE: function (offset) {
            return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | (this[offset + 3]);
        },
        readInt64BE: function (start) {
            var upper = this.readInt32BE(start),
                lower = this.readUInt32BE(start + 4);
            return upper ? upper * 4294967296 + lower : lower;
        }, //

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
                    chr = chr < 0x80 ? chr :
                          chr < 0xE0 ? ((chr & 0x3F) << 6) | (buffer[index++] & 0x3F) :
                          ((chr & 0x3F) << 12) | ((buffer[index++] & 0x3F) << 6) | (buffer[index++] & 0x3F);
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
                if (chr < 0x80)
                    buffer[index++] = chr;

                else if (chr < 0x800) {
                    buffer[index++] = 0xC0 | (chr >> 6);
                    buffer[index++] = 0x80 | (chr & 0x3F);
                }

                else {
                    buffer[index++] = 0xE0 | (chr >> 12);
                    buffer[index++] = 0x80 | ((chr >> 6) & 0x3F);
                    buffer[index++] = 0x80 | (chr & 0x3F);
                }
            }

            return index - start;
        },

        write: function (str, offset, length, encoding) {
            if (isUndefined(offset)) {
                encoding = 'utf8';
                length = this.length;
                offset = 0;
            }
            else if (isUndefined(length) && isString(offset)) {
                encoding = offset;
                length = this.length;
                offset = 0;
            }
            else if (isFinite(offset)) {
                offset = offset | 0;
                if (isFinite(length))
                    length = length | 0;
                else {
                    encoding = length;
                    length = undefined;
                }
            }
            else {
                var swap = encoding;
                encoding = offset;
                offset = length | 0;
                length = swap;
            }

            var remaining = this.length - offset;
            if (isUndefined(length) || length > remaining) length = remaining;

            if (str.length > 0 && (length < 0 || offset < 0) || offset > this.length)
                throw new RangeError('attempt to write outside buffer bounds')

            if (!encoding || reUtf8.test(encoding))
                return blitBuffer(utf8ToBytes(str, this.length - offset), this, offset, length);

            if (reBin.test(encoding))
                return blitBuffer(asciiToBytes(str), this, offset, length);

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
            }
            else {
                if (value < 0) value = 0xffff + value + 1;
                for (var i = 0, j = Math.min(this.length - offset, 2); i < j; i++) {
                    var shiftLen = 8 * (1 - i);
                    this[offset + i] = (value & (0xff << shiftLen)) >>> shiftLen;
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
            }
            else {
                if (value < 0) value = 0xffffffff + value + 1;
                for (var i = 0, j = Math.min(this.length - offset, 4); i < j; i++)
                    this[offset + i] = (value >>> (3 - i) * 8) & 0xff;
            }
            return offset + 4;
        },
        writeUInt64BE: function (value, offset) {
            for (var i = 7; i >= 0; i--, value >>= 8)
                this[offset + i] = value & 0xFF;
            return offset + 8;
        }, //

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
        for (var i = 0; i < str.length; i++)
            byteArray.push(str.charCodeAt(i) & 0xFF);
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
                        if ((units -= 3) > -1)
                            bytes.push(0xEF, 0xBF, 0xBD);
                    }
                    else if (i + 1 === length) {
                        if ((units -= 3) > -1)
                            bytes.push(0xEF, 0xBF, 0xBD);
                    }
                    else leadSurrogate = codePoint;
                    continue;
                }

                if (codePoint < 0xDC00) {
                    if ((units -= 3) > -1)
                        bytes.push(0xEF, 0xBF, 0xBD);

                    leadSurrogate = codePoint;
                    continue;
                }

                codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
            }
            else if (leadSurrogate && (units -= 3) > -1)
                bytes.push(0xEF, 0xBF, 0xBD);

            leadSurrogate = null;

            if (codePoint < 0x80) {
                if ((units -= 1) < 0) break;
                bytes.push(codePoint);
            }
            else if (codePoint < 0x800) {
                if ((units -= 2) < 0) break;
                bytes.push(
                    codePoint >> 0x6 | 0xC0,
                    codePoint & 0x3F | 0x80
                );
            }
            else if (codePoint < 0x10000) {
                if ((units -= 3) < 0) break;
                bytes.push(
                    codePoint >> 0xC | 0xE0,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                );
            }
            else if (codePoint < 0x110000) {
                if ((units -= 4) < 0) break;
                bytes.push(
                    codePoint >> 0x12 | 0xF0,
                    codePoint >> 0xC & 0x3F | 0x80,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                );
            }
            else throw new Error('Invalid code point');
        }

        return bytes
    }

    function blitBuffer(src, dst, offset, length) {
        for (var i = 0; i < length && i + offset < dst.length && i < src.length; i++)
            dst[i + offset] = src[i];
        return i;
    }


    var gb = global.Buffer;
    if (!gb) return Buffer;

    for (var key in p)
        if (!gb.prototype[key])
            gb.prototype[key] = p[key];

    for (var key in Buffer)
        if (!gb[key])
            gb[key] = Buffer[key];

    return gb;
})();
