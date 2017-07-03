function ObjectRef(id) {
    this.$ref = parseInt(id);
}

function cloneDecycle(object) {
    var ID_FIELD = '__:D',
        fin = [];

    var result = function decycle(value) {
        if (isFunc(value)) return;
        if (!value || !isObject(value) || preset.getExtPacker(value)) return value;
        if (value[ID_FIELD]) return new ObjectRef(value[ID_FIELD]);

        value[ID_FIELD] = fin.push(value);
        if (Buffer.isBuffer(value)) return value;


        if (isArray(value)) {
            var result = new Array(value.length);
            for (var i = 0; i < value.length; i++)
                if (!isUndefined(value[i]))
                    result[i] = decycle(value[i]);
            return result;
        }


        var result = {};
        eachKey(value, (k, v) => {
            if (k !== ID_FIELD)
                result[k] = decycle(v);
        });
        return result;
    }(object);

    fin.forEach(function (obj) {
        delete obj[ID_FIELD];
    });

    return result;
}

function retroCycle(object) {
    var fin = [];

    return function recycle(value) {
        if (!value || !isObject(value)) return value;
        if (value instanceof ObjectRef) return fin[value.$ref - 1];
        fin.push(value);

        if (!Buffer.isBuffer(value))
            if (isArray(value)) {
                for (var i = 0; i < value.length; i++)
                    if (!isUndefined(value[i]))
                        value[i] = recycle(value[i]);
            }
            else eachKey(value, (k, v) => value[k] = recycle(v));

        return value;
    }(object);
}
