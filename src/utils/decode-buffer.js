function DecodeBuffer(options) {
    this.codec = options && options.codec || madson.codec.preset;
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
