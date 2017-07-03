var token = new Array(256),
    uint8 = new Array(256);

if (NO_TYPED_ARRAY)
    init_tokens(writeN, writeN, writeN);
else init_tokens(write1, write2, write4);


function init_tokens(write1, write2, write4) {
    var p = Buffer.prototype;

    for (var i = 0x00; i <= 0xFF; i++)
        token[i] = uint8[i] = write0(i);

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
