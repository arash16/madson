var madson = (function () {
    import "nxutils/generic/base";

    import "./utils";
    import "./write";
    import "./read";
    import "./preset";

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

    function packer(input) {
        return Buffer.isBuffer(input) ? mDecode(input) : mEncode(input);
    }

    var madson = extend(packer, {
        createCodec: Codec,
        codec: { preset: preset },
        encode: mEncode,
        decode: mDecode
    });

    if ("isServer") {
		if (typeof module == 'object')
		    module.exports = madson;
	}
	else global.madson = madson;
	return madson;
})();

