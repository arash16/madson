function Codec() {
	if (!(this instanceof Codec))
		return new Codec();

    this.extEncoderList = [];
    this.extUnpackers = [];
    this.extPackers = {};
}

function joinFilters(filters) {
    var f = filters.slice();
    return function (value) {
        return f.reduce((v, f) => f(v), value);
    };
}

Codec.prototype = {
    addExtPacker: function (etype, Class, packer) {
        if (isArray(packer)) packer = joinFilters(packer);

        var name = Class.name;
        if (name && name !== "Object") this.extPackers[name] = extPacker;
        else this.extEncoderList.unshift([Class, extPacker]);

        function extPacker(value) {
            return new ExtBuffer(packer(value), etype);
        }
    },
    addExtUnpacker: function (etype, unpacker) {
        this.extUnpackers[etype] = isArray(unpacker) ? joinFilters(unpacker) : unpacker;
    },
    getExtPacker: function (value) {
        var c = value.constructor,
            e = c && c.name && this.extPackers[c.name];
        if (e) return e;

        for (var i = 0, pair; pair = this.extEncoderList[i]; i++)
            if (c === pair[0])
                return pair[1];
    },
    getExtUnpacker: function (type) {
        return this.extUnpackers[type] || (buffer => new ExtBuffer(buffer, type));
    }
};
