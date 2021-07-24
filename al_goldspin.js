'use strict';
globalThis.al_goldspin = (function () {
    const spin = {};
    const expose = make_exposure(spin);

    function weight() {
        return character.ctype != "merchant" && 1 || 10;
    }

    character.on("cm", event => {
        if (!al_social.is_mine(event.name))
            return;
        if (!event.message?.al_goldspin)
            return;
        const gspin = event.message.al_goldspin;
        const dest_gold = (character.gold + gspin[0]) * weight() / (weight() + gspin[1]);
        const diff = character.gold - dest_gold;
        if (diff > 0) {
            send_gold(event.name, diff);
        }
    });

    const goldspin_ring = new al_util.Ring(() =>
        Object.keys(al_social.near_party())
            .filter(x => x != character.name).sort());

    al_util.register_behaviour(2350,
        function goldspin_behaviour() {
            const send_to = goldspin_ring.next();
            if (send_to) {
                send_cm(send_to,
                    {al_goldspin: [character.gold, weight()]});
            }
        });

    return spin;
})();