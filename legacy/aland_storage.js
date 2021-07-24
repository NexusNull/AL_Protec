var aland_storage = {
    const_slot: 92,
    const_name: "aland_storage",
    save_slot: function (slot, name, code) {
        return parent.api_call("save_code", {
            code: code,
            slot: slot,
            name: name,//,
            //log: 1
            auto: !0,
            electron: !0
        });//TODO needs non-electron compat
    },
    variables: {},
    observer: {},
    write: function () {
        var result = this.save_slot(this.const_slot, this.const_name,
            "aland_storage.eval_incoming(\n"
            + JSON.stringify(this.variables, null, 2)
            + "\n);log(\"Inited key store from CODE\");");
        return result;
    },
    eval_incoming: function (object, verbose) {
        if (!object) return;
        for (var key in object) {
            var obs = this.observer[key];
            var value = object[key];
            if (obs)
                obs(value);
            this.variables[key] = value;
        }
        if (verbose) {
            this.write();
            parent.X.characters.forEach(char => {
                if (char && char.server && char.name != character.name)
                    send_cm(char.name, object);
            });
        }
    },
    set: function (key, value) {
        var obj = {};
        obj[key] = value;
        this.eval_incoming(obj, true);
    },
    get: function (key) {
        return this.variables[key];
    }
}
aland_storage.Char_key = function (_key) {
    this.key = _key;
}
aland_storage.Char_key.prototype = {
    constructor: aland_storage.Char_key,
    _access: function (_char) {
        return "char_" + (_char || character.name) + this.key;
    },
    get: function (_char) {
        return aland_storage.get(this._access(_char));
    },
    set: function (val, _char) {
        return aland_storage.set(this._access(_char), val);
    },
    set_all: function (val) {
        const delta = {};
        for (let profile of parent.X.characters) {
            delta[this._access(profile.name)] = val;
        }
        return aland_storage.eval_incoming(delta, true);
    }
};

character.on("cm", event => {
    if (parent.X.characters.some(char => char.name == event.name)) {
        aland_storage.eval_incoming(event.message);
    }
});
load_code(aland_storage.const_slot);