'use strict';
globalThis.al_social = (function () {
    const soc = {};
    const expose = globalThis.make_exposure(soc);

    const partners = [
        "Emerald",
        "NexusNull",
        "Clover",
        "Arcus"
    ];//all hail the crab god

    const MAX_PARTY_SIZE = 9;
    expose(
        function is_mine(char_name) {
            return parent.X.characters.some(char => char.name == char_name);
        });

    expose(
        function trusted(char_name) {
            return soc.is_mine(char_name) || partners.includes(char_name);
        });

    function party_count() {
        return character.party ? Object.keys(parent.party).length : 1;
    }

    expose(
        function party() {
            if (character.party)
                return parent.party;
            const result = {};
            result[character.name] = character;
            return result;
        });
    const NEARBY_DIST = 666;

    expose(
        function near_party() {
            const result = {};
            for (let key in parent.party) {
                const membr = parent.entities[key];
                if (membr && simple_distance(membr, character) <= NEARBY_DIST)
                    result[key] = membr;
            }
            result[character.name] = character;
            return result;
        });

    expose(
        function suggest_party(recv_name) {
            if (soc.party()[recv_name])
                return;
            send_cm(recv_name,
                {"al_social": party_count()});
        });

    character.on("cm", event => {
        if (!soc.trusted(event.name))
            return;
        if (!event.message?.al_social)
            return;
        const other_party = event.message.al_social;
        if (other_party > party_count() ||
            (other_party == party_count() && event.name > character.name))
            send_party_request(event.name);
        else if (other_party < MAX_PARTY_SIZE)//other party not full
            send_party_invite(event.name);
    });

    const partner_ring = new al_util.Ring(() => partners);
    const companion_ring = new al_util.Ring(() =>
        parent.X.characters.filter(x =>
            x.name != character.name &&
            x.server == parent.server_region + parent.server_identifier));
    let index_toggler = false;

    al_util.register_behaviour(2200,
        function party_behaviour() {
            if (party_count() >= MAX_PARTY_SIZE)
                return;
            if (index_toggler) {
                if (partners.length > 0) {
                    soc.suggest_party(partner_ring.next());
                }
            } else {
                const nxt = companion_ring.next();

                if (nxt) {
                    soc.suggest_party(nxt.name);
                }
            }
            index_toggler = !index_toggler;
        });

    al_util.psock_on('invite', function (data) {
        if (data && data.name && soc.trusted(data.name))
            accept_party_invite(data.name);
    });

    al_util.psock_on('request', function (data) {
        if (data && data.name && soc.trusted(data.name))
            accept_party_request(data.name);
    });
    return soc;
})();