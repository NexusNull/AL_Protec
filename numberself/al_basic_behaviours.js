//respawning, potions
'use strict';

globalThis.al_basic_behaviours = (function () {
    const bas = {};
    const expose = make_exposure(bas);

    al_util.register_behaviour(3000,
        function respawn_behaviour() {
            if (!character.rip) return;
            respawn();
        });

    const potion_safety = new al_util.Timeout(al_util.recommended_grace_period());
    al_util.register_behaviour(al_util.recommended_monitoring_interval(),
        function potion_behaviour() {
            if (character.rip) return;
            if (!potion_safety.unlocked()) return;
            if (new Date() < parent.next_skill.use_hp) return;

            function fits_potion(pot) {
                const edge_cases = {"regen_hp": ["hp", 50], "regen_mp": ["mp", 100]};
                const [ress, amount] = edge_cases[pot] || [pot.slice(0, 2), G.items[pot].gives[0][1]];
                return character["max_" + ress] - character[ress] >= amount;
            }

            function choose_potion(prioritys, fallback = false) {
                let using_slot;
                for (let pot of prioritys) {
                    if (fits_potion(pot) &&
                        (using_slot = al_items.locate(pot)) >= 0) {
                        potion_safety.execute(() => use(using_slot));
                        return;
                    }
                }
                if (fallback && fits_potion(fallback))
                    potion_safety.execute(() => use(fallback));
            }

            const hp_critical = character.hp / character.max_hp <= 0.5;
            const mp_critical = character.mp / character.max_mp <= 0.2;
            const priest_present = Object.values(al_social.near_party()).some(x => x.ctype == "priest");
            if (mp_critical) {
                //force restore mp
                choose_potion(["mpot1", "mpot0"], "regen_mp")
            } else if (hp_critical) {
                //force restore hp
                choose_potion(["hpot1", "hpot0"], "regen_hp")
            } else if (priest_present) {
                //heavily prefer mp
                choose_potion(["mpot1", "mpot0", "hpot1", "hpot0"])
            } else {
                //prefer hp
                choose_potion(["hpot1", "mpot1", "hpot0", "mpot0"])
            }
        });

    function stand_behaviour() {
        if (is_moving(character) && character.stand) {
            parent.close_merchant();
        } else if (!is_moving(character)) {
            let stand_location;
            if ((stand_location = al_items.locate("computer"))
                && !(character.stand && character.stand == "cstand")) {
                parent.open_merchant(stand_location);
            } else if ((stand_location = al_items.locate("stand0"))
                && !character.stand) {
                parent.open_merchant(stand_location);
            }
        }
    }

    if (character.ctype == "merchant") {
        al_util.register_behaviour(al_util.recommended_monitoring_interval(),
            stand_behaviour);
    }

    //TODO does this work as intended on pvp?
    character.on("hit", function (data) {
        if (data.damage && !is_on_cooldown("use_town")
            && (character.hp - data.damage) / character.max_hp <= 0.3) {
            //log out
            al_util.log("hp is critical. logging out");
            al_deploy.deploy();
        }
    });

    return bas;
})();