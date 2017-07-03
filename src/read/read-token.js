var token = (function (token) {
    for (var i = 0x00; i <= 0x7f; i++)
        token[i] = constant(i);

    for (i = 0x80; i <= 0x8f; i++)
        token[i] = fix(i - 0x80, format.map);

    for (i = 0x90; i <= 0x9f; i++)
        token[i] = fix(i - 0x90, format.array);

    for (i = 0xa0; i <= 0xbf; i++)
        token[i] = fix(i - 0xa0, format.str);

    [
        constant(null),
        null,
        constant(false),
        constant(true),
        flex(format.uint8, format.bin),
        flex(format.uint16, format.bin),
        flex(format.uint32, format.bin),
        flex(format.uint8, format.ext),
        flex(format.uint16, format.ext),
        flex(format.uint32, format.ext),
        format.float32,
        format.float64,
        format.uint8,
        format.uint16,
        format.uint32,
        format.uint64,
        format.int8,
        format.int16,
        format.int32,
        format.int64,
        fix(1, format.ext),
        fix(2, format.ext),
        fix(4, format.ext),
        fix(8, format.ext),
        fix(16, format.ext),
        flex(format.uint8, format.str),
        flex(format.uint16, format.str),
        flex(format.uint32, format.str),
        flex(format.uint16, format.array),
        flex(format.uint32, format.array),
        flex(format.uint16, format.map),
        flex(format.uint16, format.map)
    ].forEach((t, i) => token[0xc0 + i] = t);

    for (i = 0xe0; i <= 0xff; i++)
        token[i] = constant(i - 0x100);

    function constant(value) {
        return () => value;
    }

    function flex(lenFunc, decodeFunc) {
        return decoder => decodeFunc(decoder, lenFunc(decoder));
    }

    function fix(len, method) {
        return decoder => method(decoder, len);
    }

    return token;
})(new Array(256));
