sleep = async function (num) {
    return new Promise(function (resolve) {
        setTimeout(resolve, num);
    });
};

const Inventory = {
    swap: async function (a, b) {
        const socket = parent.socket;
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

    sendItem: async function (receiver, num, quantity) {
        const socket = parent.socket;
        return new Promise(function (resolve, reject) {
            if (!receiver) reject("missing receiver");
            if (receiver.name) receiver = receiver.name;
            if (quantity === 0) return;

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
            setTimeout(reject.bind(null, "mailItem timed out"), 5000);

            socket.emit("mail", {"to": receiver, "subject": "Item", "message": "", item: 1});
        });
    },

    mailItem: async function (receiver, num) {
        await this.swap(0, num);
        await this.mailFirst(receiver);
        await this.swap(num, 0);
    },

    exchange: async function (num) {
        const socket = parent.socket;
        return new Promise(function (resolve, reject) {
            if (typeof character.q.exchange !== "undefined")
                return reject("Already Exchanging");
            if (!character.items[num])
                return reject("No Item present in slot " + num);
            let state = 0;

            function response(data) {
                if (state === 0 && typeof data.q.exchange !== "undefined") {
                    state++;
                }
                if (state === 1 && typeof data.q.exchange === "undefined") {
                    socket.removeListener("player", response);
                    resolve(data);
                }
            }

            socket.on("player", response);
            setTimeout(reject.bind(null, "exchange timed out"), 15000);

            socket.emit("exchange", {item_num: num, q: "" + character.items[num].q});
        });
    },
    /*
    async listItemForSale(num, slot, q, price) {
        const socket = parent.socket;
        return new Promise(async (resolve, reject) => {

            socket.emit("equip", {"q": "" + q, "slot": "" + slot, "num": "" + num, "price": "" + price});

            function response(data) {
                if (data.startsWith("Listed")) {
                    socket.removeListener("game_response", response);
                    resolve(data);
                }
            }
            socket.on("game_log", response);
        })
    },*/
    async fillStack(target, source) {
        return new Promise(async (resolve, reject) => {
            let targetItem = character.items[target]
            let sourceItem = character.items[source];
            if (!targetItem)
                return reject("Missing target Item");
            if (!sourceItem)
                return reject("Missing source Item");
            const stackSize = G.items[targetItem.name].s || 9999;

            await this.swap(0, target);
            await this.sendItem(character.id, source, stackSize - targetItem.q);
            await this.swap(target, 0);

        })
    }
};
