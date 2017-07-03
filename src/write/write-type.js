var type = (function () {
    function bool(encoder, value) {
        token[value ? 0xc3 : 0xc2](encoder, value);
    }

    function number(encoder, value) {
        var ivalue = value | 0, type;
        if (value !== ivalue)
            return void token[0xcb](encoder, value);

        if (-0x20 <= ivalue && ivalue <= 0x7F)
            type = ivalue & 0xFF;
        else if (0 <= ivalue)
            type = ivalue <= 0xFF ? 0xcc : ivalue <= 0xFFFF ? 0xcd : 0xce;
        else
            type = -0x80 <= ivalue ? 0xd0 : -0x8000 <= ivalue ? 0xd1 : 0xd2;

        token[type](encoder, ivalue);
    }

    function string(encoder, value) {
        var length = value.length,
            maxsize = 5 + length * 3;

        encoder.reserve(maxsize);

        var expected = (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5,
            start = encoder.offset + expected;

        length = encoder.buffer.writeString(value, start);
        var actual = (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;

        if (expected !== actual) {
            var targetStart = encoder.offset + actual,
                end = start + length;

            encoder.buffer.copy(encoder.buffer, targetStart, start, end);
        }

        var type = actual === 1 ? 0xa0 + length : actual <= 3 ? 0xd7 + actual : 0xdb;
        token[type](encoder, length);
        encoder.offset += length;
    }

    var extMap = [];
    for (var i = 0; i < 5; i++)
        extMap[1 << i] = 0xd4 + i;

    function object(encoder, value) {
        if (isArray(value)) return array(encoder, value);
        if (value === null) return nil(encoder, value);
        if (Buffer.isBuffer(value)) return bin(encoder, value);

        var packer = encoder.codec.getExtPacker(value);
        if (packer) value = packer(value);
        if (value instanceof ExtBuffer) return ext(encoder, value);

        map(encoder, value);
    }

    function nil(encoder, value) {
        token[0xc0](encoder, value);
    }

    function array(encoder, value) {
        var length = value.length,
            type = length < 16 ? 0x90 + length : length <= 0xFFFF ? 0xdc : 0xdd;

        token[type](encoder, length);
        for (var i = 0; i < length; i++)
            encode(encoder, value[i]);
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
        'boolean': bool,
        'number': number,
        'string': string,
        'object': object,
        'function': nil,
        'symbol': nil,
        'undefined': nil
    };
})();
