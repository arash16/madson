var encode = function () {
    import "./write-type";
    import "./write-token";

    return function (encoder, value) {
        var func = type[typeof value];
        if (!func) throw new Error("Unsupported type \"" + (typeof value) + "\": " + value);
        func(encoder, value);
    };
}();
