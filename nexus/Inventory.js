if(!module)
    module = {};

module.exports = {
    swap: async function (a, b) {
        let socket = parent.socket;
        return new Promise(function (resolve, reject) {
            if (a === b)
                resolve();

            function onInvUpdate() {
                socket.removeListener("player", onInvUpdate);
                socket.removeListener("player_nr", onInvUpdate);
                resolve();
            }

            socket.on("player", onInvUpdate);
            socket.on("player_nr", onInvUpdate);

            socket.emit("imove", {a: a, b: b});
            setTimeout(reject.bind(null, "swap timed out"), 1000);
        });
    },
    find: function (name, filter = {}) {
        let results = [];
        for (let i = 0; i < character.items.length; i++) {
            if (!character.items[i]) continue;
            if (character.items[i].name !== name) continue;
            if (filter.minLevel && character.items[i].level && filter.minLevel > character.items[i].level) continue;
            if (filter.level && character.items[i].level && filter.level !== character.items[i].level) continue;
            if (filter.maxLevel && character.items[i].level && filter.maxLevel < character.items[i].level) continue;
            if (filter.minQuantity && character.items[i].q && filter.minQuantity > character.items[i].q) continue;
            results.push(i);
        }
        return results;
    },

    sendItem: async function (receiver, num) {
        const socket = parent.socket;
        return new Promise(function (resolve, reject) {
            if (!receiver) reject("missing receiver");
            if (receiver.name) receiver = receiver.name;

            function response(data) {
                if (data.response === "item_sent") {
                    socket.removeListener("game_response", response);
                    resolve(data);
                }
            }

            socket.on("game_response", response);
            setTimeout(reject.bind(null, "sendItem timed out"), 1000);

            socket.emit("send", {name: receiver, num: num, q: quantity || 1});
        });
    },
    mailFirst: async function (receiver) {
        const socket = parent.socket;
        return new Promise(function (resolve, reject) {
            if (!receiver) reject("missing receiver");
            if (receiver.name) receiver = receiver.name;

            function response(data) {
                if (data.response === "mail_sent") {
                    socket.removeListener("game_response", response);
                    resolve(data);
                }
            }

            socket.on("game_response", response);
            setTimeout(reject.bind(null, "mailItem timed out"), 1000);

            socket.emit("mail", {"to": receiver, "subject": "Item", "message": "", item: 1});
        });
    },

    mailItem: async function (receiver, num) {
        await this.swap(0, num);
        await this.mailFirst(receiver);
        await this.swap(num, 0);
    },

    exchange: async function (num) {

    }
};

