import "./codec";
var preset = (function (preset) {
    var encode = mEncode, decode = mDecode, last;
    var ERROR_COLUMNS = 'name message stack columnNumber fileName lineNumber'.split(' ');

    function packError(value) {
        var out = {};
        for (var i = 0, key; key = ERROR_COLUMNS[i]; i++)
            if (!isUndefined(value[key]))
            	out[key] = value[key];
        return out;
    }
    function unpackError(Class) {
        return function (value) {
            var out = new Class(value.message);
            for (var i = 0, key; key = ERROR_COLUMNS[i]; i++)
                if (!isUndefined(value[key]))
                	out[key] = value[key];
            return out;
        };
    }

    function packValueOf(value) {
        return value.valueOf();
    }
    function unpackClass(Class) {
        return function (value) {
            return new Class(value);
        };
    }

    function packRegExp(value) {
        value = RegExp.prototype.toString.call(value).split('/');
        value.shift();

        var out = [value.pop()];
        out.unshift(value.join('/'));
        return out;
    }
    function unpackRegExp(value) {
        return RegExp.apply(null, value);
    }

    function packArrayBuffer(value) {
        return new Buffer(new Uint8Array(value));
    }
    function unpackArrayBuffer(value) {
        return (new Uint8Array(value)).buffer;
    }

    function packTypedArray(value) {
        return new Buffer(new Uint8Array(value.buffer));
    }
    function packBuffer(value) {
        return new Buffer(value);
    }

    [
        [0x0E, Error, unpackError(Error), packError],
        [0x01, EvalError, unpackError(EvalError)],
        [0x02, RangeError, unpackError(RangeError)],
        [0x03, ReferenceError, unpackError(ReferenceError)],
        [0x04, SyntaxError, unpackError(SyntaxError)],
        [0x05, TypeError, unpackError(TypeError)],
        [0x06, URIError, unpackError(URIError)],
        [0x0B, Boolean, unpackClass(Boolean), packValueOf],
        [0x0C, String, unpackClass(String)],
        [0x0F, Number, unpackClass(Number)],
        [0x0D, Date, unpackClass(Date), Number],
        [0x0A, RegExp, unpackRegExp, packRegExp],
        [0x3F, ObjectRef, unpackClass(ObjectRef), v => v.$ref]
    ].forEach(function (ext) {
        preset.addExtPacker(ext[0], ext[1], [last = ext[3] || last, encode]);
        preset.addExtUnpacker(ext[0], [decode, ext[2]]);
    });


    if (typeof Uint8Array !== 'undefined') {
        [
            [0x1A, ArrayBuffer, unpackArrayBuffer, packArrayBuffer],
            [0x11, Int8Array, unpackClass(Int8Array), packBuffer],
            [0x12, Uint8Array, unpackClass(Uint8Array)],
            [0x13, Int16Array, 0, packTypedArray],
            [0x15, Int32Array],
            [0x14, Uint16Array],
            [0x16, Uint32Array],
            [0x17, Float32Array],
            [0x1D, DataView]
        ].forEach(function (ext, i) {
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
})(Codec());
