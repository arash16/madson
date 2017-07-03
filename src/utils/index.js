import "./buffer";
import "./ieee754";
import "./decycle";
import "./encode-buffer";
import "./decode-buffer";

function ExtBuffer(buffer, type) {
    this.buffer = buffer;
    this.type = type;
}

var BUFFER_SHORTAGE = new Error("BUFFER_SHORTAGE"),
    IS_BUFFER_SHIM = "TYPED_ARRAY_SUPPORT" in Buffer,
    NO_TYPED_ARRAY = IS_BUFFER_SHIM && !Buffer.TYPED_ARRAY_SUPPORT;
