var decode = function () {
    import "./read-format";
    import "./read-token";

    return function (decoder) {
        var type = format.uint8(decoder);
        if (!token[type])
            throw new Error("Invalid type: " + (type ? ("0x" + type.toString(16)) : type));

        return token[type](decoder);
    }
}();
