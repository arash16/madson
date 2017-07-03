var format = (function () {
    function map(decoder, len) {
        var value = {};
        for (var i = 0; i < len; i++) {
            var key = decode(decoder);
            value[key] = decode(decoder);
        }
        return value;
    }

    function array(decoder, len) {
        var value = new Array(len);
        for (var i = 0; i < len; i++)
            value[i] = decode(decoder);
        return value;
    }

    function str(decoder, len) {
        var buffer = decoder.buffer,
            start = decoder.offset,
            end = decoder.offset = start + len;

        if (end > buffer.length) throw BUFFER_SHORTAGE;
        return IS_BUFFER_SHIM || !Buffer.isBuffer(buffer) ?
               buffer.readString(start, end) :
               buffer.toString("utf-8", start, end);
    }

    function bin(decoder, len) {
        var start = decoder.offset,
            end = decoder.offset = start + len;

        if (end > decoder.buffer.length) throw BUFFER_SHORTAGE;
        return decoder.buffer.slice(start, end);
    }

    function ext(decoder, len) {
        var start = decoder.offset,
            end = decoder.offset = start + len + 1;
        if (end > decoder.buffer.length) throw BUFFER_SHORTAGE;

        var type = decoder.buffer[start],
            unpack = decoder.codec.getExtUnpacker(type);

        if (!unpack) throw new Error("Invalid ext type: " + (type && "0x" + type.toString(16)));
        return unpack(decoder.buffer.slice(start + 1, end));
    }

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
        array: array,
        map: map,
        str: str,
        bin: bin,
        ext: ext,
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
})();
