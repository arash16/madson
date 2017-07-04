var MIN_BUFFER_SIZE = 2048;
var MAX_BUFFER_SIZE = 65536;

function EncodeBuffer(options) {
    this.codec = options && options.codec || madson.codec.preset;
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
        }
        else {
            this.flush();
            this.push(buffer);
        }
    }
};
