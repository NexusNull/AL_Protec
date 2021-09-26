//rewrite edition


'use strict';
globalThis.al_items = (function () {
    const it = {};
    const expose = make_exposure(it);
    it.indices = []
    for (let i = 0; i < character.items.length; i++)
        it.indices.push(i);

    it.item_lock = new al_util.Timeout(al_util.recommended_grace_period());
    it.booster_lock = new al_util.Timeout(al_util.recommended_grace_period());

    expose(
        function free_slots(inv = character.items) {
            return inv.filter(x => !x).length;
        });

    expose(
        function is_booster(itm) {
            return ["goldbooster", "xpbooster", "luckbooster"].includes(itm?.name);
        });

    expose(
        function compile_filter(name, filt = itm => true) {
            return name ? itm => itm?.name == name && filt(itm) : filt;
        });

    expose(
        function locate_all(name, filt = itm => true) {
            const decider = it.compile_filter(name, filt);
            return it.indices.filter(i => decider(character.items[i]));
        });

    expose(
        function get_quantity(name, filt = itm => true) {
            const occurences = it.locate_all(name, filt);
            return occurences.reduce((a, b) => a + (character.items[b]?.q || 1), 0);
        });

    expose(
        function locate(name, filt = itm => true) {
            const decider = it.compile_filter(name, filt);
            return character.items.findIndex(itm => decider(itm));
        });

    expose(
        function locate_max_level(name, filt = itm => true) {
            const decider = it.compile_filter(name, filt);
            const combined_locations = it.locate_all(false, decider)
                .concat(Object.keys(character.slots)
                    .filter(x => !x.includes("trade"))
                    .filter(x => decider(character.slots[x])));
            const max_level = Math.max(
                ...combined_locations
                    .map(x => character.items[x]?.level || character.slots[x]?.level || 0));
            return [max_level, combined_locations
                .filter(x => character.items[x]?.level >= max_level
                    || character.slots[x]?.level >= max_level)];
        });

    expose(
        function semantic_inventory(container = character.items) {
            const result = {}
            for (let i = 0; i < container.length; i++) {
                const itm = container[i];
                const i_name = (itm && itm.name) || "null";
                const i_lvl = (itm && itm.level) || 0;
                const i_amount = (itm && itm.q) || 1;

                if (!(i_name in result))
                    result[i_name] = {};
                if (!(i_lvl in result[i_name]))
                    result[i_name][i_lvl] = [0, {}];
                result[i_name][i_lvl][0] += i_amount;
                result[i_name][i_lvl][1][i] = i_amount;
            }
            return result;
        });

    expose(
        function find_npcs_selling(item_name) {
            return Object.keys(G.npcs).filter(x => G.npcs[x].items?.includes(item_name));
        });

    //you can interact with npcs
    //if simple_dist from u is lower
    const NPC_REACH = 500;
    const SAFE_NPC_REACH = NPC_REACH * 0.95;
    expose(
        function interactable_npcs() {
            return G.maps[character.map].npcs.filter(npc => npc.position
                && SAFE_NPC_REACH >= simple_distance(
                    character, {x: npc.position[0], y: npc.position[1]}))
                .map(x => x.id);
        });

    return it;
})();