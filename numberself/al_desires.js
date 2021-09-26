//unified way to procure common goods
'use strict';
globalThis.al_desires = (function () {
    const des = {};
    const expose = make_exposure(des);

    const desire_map = {};

    expose(
        function register_desire(func, name = func.name) {
            desire_map[name] = func;
        });

    expose(
        function compute_all() {
            const result = {};
            Object.values(desire_map)
                .forEach(func => {
                    const cur_needs = func();
                    for (let item_name in cur_needs) {
                        result[item_name] = Math.max(result[item_name] || 0,
                            cur_needs[item_name]);
                    }
                });

            return result;
        });

    des.register_desire(
        //spend 40% of income on potions in the early game
        function potion_desire() {
            if (character.gold < 1e3) {
                return {};
            }
            const gold_lattices = [1e7, 1e6, 1e5, 1e4, 1e3].filter(x => character.gold >= x);
            //amount of cash to spend on each pot type
            const ref_val = gold_lattices[0] / 10;

            function recommend_amount(pot_name) {
                return Math.min(ref_val / G.items[pot_name].g, 9995);
            }

            const result = {};
            ["hpot0", "mpot0", "hpot1", "mpot1"]
                .forEach(pot_name =>
                    result[pot_name] = recommend_amount(pot_name));

            return result;
        });

    //al_util.log(JSON.stringify(des.compute_all()));

    //TODO add a way to obtain items from merchant
    //merchant cooldown: 15 seconds
    //TODO finetune cooldowns
    //TODO check #empty slots
    al_util.register_behaviour(570,
        function buy_desired() {
            if (!al_items.item_lock.unlocked()) {
                return;
            }
            if (character.map == "bank") {
                //TODO pull desires from bank
                //we cant buy in bank
                return;
            }
            const current_desires = des.compute_all();
            let buyables = Object.keys(current_desires)
                .filter(x => G.items[x]?.buy);
            if (!al_util.is_hardcore() && al_items.locate("computer") < 0) {
                //filter down to items from nearby npcs
                const salesmen = al_items.interactable_npcs();
                buyables = buyables.filter(itm => {
                    return salesmen.some(x => G.npcs[x].items?.includes(itm));
                });
            }

            for (let itm of buyables) {
                const buy_amount = Math.min(
                    current_desires[itm] - al_items.get_quantity(itm),
                    character.gold / G.items[itm].g >> 0);
                if (buy_amount > 0) {
                    al_items.item_lock.execute(() => buy(itm, buy_amount));
                    return;
                }
            }
            //TODO request unbuyable from merchant here
        });


    return des;
})();