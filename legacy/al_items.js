var current_hpot = "hpot1";
var current_hpot_val = G.items[current_hpot].gives[0][1];
var current_mpot = "mpot0";

var alt_hpot = "hpot0";
var alt_hpot_val = G.items[alt_hpot].gives[0][1];

window.al_items = {};
if (!parent.fail_counts) {//rn im a bit confused about scopes.
    //TODO rewrite this so it just uses the child local variables
    parent.fail_counts = {};
    parent.socket.on("game_response", function (a) {
        let b = a.response || a;
        parent.add_log(JSON.stringify(b));
        if ("upgrade_success" == b)
            parent.fail_counts[a.level] = 0;
        else if ("upgrade_fail" == b)
            parent.fail_counts[a.level] = (parent.fail_counts[a.level] || 0) + 1;
    });
}

//this regex lets you inspect the datastream of websocket
//^\d+\["(?!entities)(?!hit)(?!player)(?!chest_opened)(?!game_log)(?!action).*
//^\d+\["(?!entities)(?!hit)(?!player)(?!chest_opened)(?!game_log)(?!action",{"attacker":"(?!CodeGorm).*)(?!disappearing_text).*
//42["code_eval","console.log(\"hdrtj6tzkit\");"] is something albot doesnt yet do
//eval(fs.readFileSync('CODE/' + file) + '');

//42["game_log",{"message":"324 gold","color":"gold"}]

/*

var gold_buf = 0;
var al_gold_data=[];
parent.socket.on("game_log",x=>{
    let flurm;
    if(x && x.message && (flurm = /(\d+) gold/.exec(x.message)))
        gold_buf += parseInt(flurm[1]);
    return null;
});

setInterval(()=>{al_gold_data.push(gold_buf);gold_buf=0;},1000*60*10);

*/

function positive_do(num, func) {
    if (num > 0)
        func(num);
}

function recursive_compound() {
    return single_compound()
        .then(x => recursive_compound());
}

function single_compound() {
    //return a compounding job
    for (var i = 0; i < 42; i++) {

        var item = character.items[i];
        if (!item) continue;
        var def = G.items[item.name];
        if (!def.compound) continue; // check whether the item can be compounded
        for (var j = i + 1; j < 42; j++) {
            if (!character.items[j]) continue;
            if (character.items[j].name != item.name) continue;
            if (character.items[j].level != item.level) continue;
            for (var k = j + 1; k < 42; k++) {
                if (!character.items[k]) continue;
                if (character.items[k].name != item.name) continue;
                if (character.items[k].level != item.level) continue;
                var offering = null;
                // if(item.level==2) offering=locate_item("offering");
                if (item_grade(item) == 2) continue; // rare item
                var scroll_name = item_grade(item) == 0 ? "cscroll0" : "cscroll1";

                return find_or_buy(scroll_name)
                    .then(x => compound(i, j, k, x.num, offering))
                    //TODO this could use a nicer output
                    .then(x => aland_loggi.log(JSON.stringify(x) + " on " + item.name + ":" + item.level));
            }
        }
    }
    return Promise.reject("No compoundable triplet");
}

function single_compound2(slot) {
    //return a compounding job
    const item = character.items[slot];
    if (!item) return false;
    const def = G.items[item.name];
    if (!def.compound) return false;
    const _grade = item_grade(item);
    if (item.level >= 3 && (!["dexamulet", "intamulet", "stramulet"].includes(item.name))) return false; // rare item
    if (item.level >= 4) return false;
    if (_grade == 2) return false; // rare item
    for (let j = 0; j < 42; j++) {
        if (j == slot) continue;
        if (!character.items[j]) continue;
        if (character.items[j].name != item.name) continue;
        if (character.items[j].level != item.level) continue;
        for (var k = j + 1; k < 42; k++) {
            if (k == slot) continue;
            if (!character.items[k]) continue;
            if (character.items[k].name != item.name) continue;
            if (character.items[k].level != item.level) continue;

            var offering = null;
            // if(item.level==2) offering=locate_item("offering");
            const scroll_name = "cscroll" + _grade;
            return find_or_buy(scroll_name)
                .then(_ev => compound(slot, j, k, _ev.num, offering))
                //TODO this could use a nicer output
                .then(x => aland_loggi.log(JSON.stringify(x) + " on " + item.name + ":" + item.level));
        }
    }
    return false;
}

function item_location(name, level) {
    var itm = character.items;
    for (let i in itm) {
        if (!itm[i] || itm[i].name != name) continue;
        if (level > 0 && level <= itm[i].level) continue;
        return i;
    }
    return null;
}

var magic_spot = {"map": "main", "x": -101, "y": -122};

function favorite_spot() {
    return smart_move(magic_spot);
}

function bank_pry() {
    const emptys = [];
    const autobuy_excludes = [...Array(42).keys()].filter(function (i) {
        let itm = character.items[i];
        return (itm && itm.name in (auto_buy.get() || {}) && itm.name in (auto_craft.get() || {}) && itm.level < (auto_craft.get() || {})[itm.name])
    });

    return Promise.resolve(0)
        .then(x => bank_safe(autobuy_excludes))//TODO precompute list of excludes
        .then(x => Sleep(300))
        .then(x => {
            for (let i = 0; i < 42; i++) {
                if (!character.items[i])
                    emptys.push(i);
            }
        })
        .then(x => bank_up())
        .then(x => Sleep(300))
        .then(x => bank_safe(emptys.concat(autobuy_excludes)))
        .then(x => Sleep(300))
        .then(x => bank_up())
        .then(x => Sleep(300))
}

function party_healthy() {
    var result = true;
    for (name in get_party()) {
        var entity = name == character.name ? character : parent.entities[name]
        if (entity) result = result && entity.hp >= entity.max_hp * 0.8;
        if (entity && entity.ctype == "priest") result = result && entity.mp >= entity.max_mp * 0.6;
    }
    return result;
}

function item_stack_size(name) {
    var itm = character.items;
    var result = 0;
    for (let i in itm) {
        if (!itm[i]) continue;
        if (itm[i].name == name || (itm[i].name == "placeholder" && itm[i].p && itm[i].p.name == name))
            result += itm[i].q || 1;
    }
    return result;
}

function find_or_buy(item_name, level) {
    var item_place = item_location(item_name, level);
    return item_place == null ? buy(item_name, 1) :
        Promise.resolve({"num": item_place})
}

const auto_bank = {
    wcap: true,
    wbreeches: true,
    swifty: true,
    wshoes: true,
    quiver: true,
    wgloves: true,
    wattire: true,
    vitscroll: true,
    seashell: true,
    leather: true,
    firestaff: true,
    fireblade: true,
    sshield: true,
    coat: true,
    pants: true,
    pvptoken: true,
    poison: true,
    glitch: true,
    stinger: true
}

function bank_safe(exclude_slots, index, store_any) {//TODO refactor this to do its thing proper
    index = index || 0;
    exclude_slots = exclude_slots || [];

    for (let i = index; i < 42; i++) {
        if (exclude_slots.includes(i)) continue;
        const itm = character.items[i];
        if (itm && (G.items[itm.name].compound || G.items[itm.name].type == "gem"
            || (store_any && (G.items[itm.name].type == "material" || itm.v
                || itm.name in auto_bank)))) {
            bank_store(i);
            return Sleep(220).then(x => bank_safe(exclude_slots, i + 1, store_any));
        }
    }
    if (!store_any)
        return bank_safe(exclude_slots, 0, true);
}

//there is no dedicated response for bank ops. you simple get a player packet
//as such a bank sorter needs to run iteratively
const b_pax = Object.keys(bank_packs);

//42["bank",{"operation":"swap","pack":"items0","str":-1,"inv":1}]
function sort_pack(name) {
    let inv_copy = [...character.bank[name]];

    function itm_cmp(a, b) {
        return ((a == null) - (b == null)) || a && (a.name < b.name ? -1 : +(a.name > b.name)) || a && (b.level - a.level);
    }

    inv_copy = inv_copy.sort(itm_cmp);
    for (let i = 0; i < 41; i++) {
        if (itm_cmp(character.bank[name][i], character.bank[name][i + 1]) > 0) {
            parent.socket.emit("bank", {operation: "move", pack: name, a: i, b: i + 1});
            return Sleep(300)
                .then(x => sort_pack(name));
        }
    }
}

function bank_unwrap(index) {
    const pack_index = index % 42;
    return character.bank[b_pax[pack_index]]
        && character.bank[b_pax[pack_index]][index / 42 | 0];

}

function _getAllIndexes(arr, val) {
    var indexes = [], i = -1;
    while ((i = arr.indexOf(val, i + 1)) != -1) {
        indexes.push(i);
    }
    return indexes;
}

function bank_pull(itm_name, all) {
    if (!character.bank) return game_log("Not inside the bank");
    let free_spots = character.items.filter(x => x == null).length;

    for (let i = 0; i < 42 * b_pax.length; i++) {
        if (free_spots < 1) return;
        const item = bank_unwrap(i);
        if (!item) continue;
        if (item.name != itm_name) continue;
        parent.socket.emit("bank", {operation: "swap", pack: b_pax[i % 42], str: (i / 42 | 0), inv: -1});
        free_spots--;
        if (!all)
            return;
    }
}

//takes ready to compound items from bank
function bank_take() {//TODO negative numbers as inventory
    // bank_store(0) - Stores the first item in inventory in the first/best spot in bank
    // parent.socket.emit("bank",{operation:"swap",pack:pack,str:num,inv:num});
    // Above call can be used manually to pull items, swap items and so on - str is from 0 to 41, it's the storage slot #
    // parent.socket.emit("bank",{operation:"swap",pack:pack,str:num,inv:-1}); <- this call would pull an item to the first inventory slot available
    // pack is one of ["items0","items1","items2","items3","items4","items5","items6","items7"]
    if (!character.bank) return game_log("Not inside the bank");
    if (character.items.filter(x => x == null).length <= 3) return game_log("Inventory pretty full");

    for (let i = 0; i < 42 * b_pax.length; i++) {
        const item = bank_unwrap(i);
        if (!item) continue;
        //console.log(item);
        if (item.level >= 3 && (!["dexamulet", "intamulet", "stramulet"].includes(item.name))) continue; // rare item
        if (item.level >= 4) continue;
        var def = G.items[item.name];
        if (!def.compound) continue; // check whether the item can be compounded
        for (let j = i + 1; j < 42 * b_pax.length; j++) {
            if (!bank_unwrap(j)) continue;
            if (bank_unwrap(j).name != item.name) continue;
            if (bank_unwrap(j).level != item.level) continue;
            for (let k = j + 1; k < 42 * b_pax.length; k++) {
                if (!bank_unwrap(k)) continue;
                if (bank_unwrap(k).name != item.name) continue;
                if (bank_unwrap(k).level != item.level) continue;

                parent.socket.emit("bank", {operation: "swap", pack: b_pax[i % 42], str: (i / 42 | 0), inv: -1});
                parent.socket.emit("bank", {operation: "swap", pack: b_pax[j % 42], str: (j / 42 | 0), inv: -1});
                parent.socket.emit("bank", {operation: "swap", pack: b_pax[k % 42], str: (k / 42 | 0), inv: -1});
                log("taking " + i + " " + j + " " + k);
                return Sleep(500).then(x => bank_take());
                //take from bank
                //then call self
            }
        }
    }

}

function bank_up() {
    if (!character.bank) return game_log("Not inside the bank");
    if (character.items.filter(x => x == null).length <= 1) return game_log("Inventory pretty full");

    for (let i = 0; i < 42 * b_pax.length; i++) {
        const item = bank_unwrap(i);
        if (!item) continue;
        var def = G.items[item.name];
        if (!def.upgrade) continue; // check whether the item can be compounded
        if (auto_craft.get() && auto_craft.get()[item.name]) {
            const trg_lv = auto_craft.get()[item.name].level || auto_craft.get()[item.name];
            if (trg_lv > (item.level || 0)) {
                parent.socket.emit("bank", {operation: "swap", pack: b_pax[i % 42], str: (i / 42 | 0), inv: -1});
                return Sleep(300).then(x => bank_up());
            }

        }
        //console.log(item);

    }
    return bank_take();

}

function attempt_slot(slot, level, attempts, multiples) {
    if (character.items[slot])
        return attempt_item(character.items[slot].name, level, attempts, multiples);
    else
        return Promise.reject("No item in slot " + slot);
}

var important_business = Promise.resolve(1);

function attempt_item(item_name, level, attempts, multiples) {
    var item_place;
    var taken_actions = find_or_buy(item_name, level)
        .then(event => item_place = event.num)
        .then(event => log(attempts + " attempts left"));
    var next_handler_decider = x => {
        var current_item_iteration = character.items[item_place];
        if (current_item_iteration && current_item_iteration.level < level) {
            return find_or_buy("scroll" + item_grade(current_item_iteration))
                .then(event => upgrade(item_place, event.num))
                .then(x => important_business)
                .then(() => 1, () => 1)
                .then(next_handler_decider);
        } else if (multiples || !current_item_iteration)
            return attempts > 1 ? attempt_item(item_name, level, attempts - 1, multiples) : Promise.reject("No attempts left");
        return x;
    };
    return taken_actions.then(next_handler_decider);
}

function item_location2(name, level) {
    const result = item_location(name, level);
    return result == null ? -1 : result;
}

function find_or_buy2(item_name, _amount, level) {
    const needs_amount = _amount || 1;
    const item_place = item_location2(item_name, level);
    const has_amount = item_place >= 0 ? (character.items[item_place].q || 1) : 0;
    return has_amount >= needs_amount ? Promise.resolve({"num": item_place})
        : buy(item_name, needs_amount - has_amount);
}

function single_upgrade(slot, mode) {
    const itm = character.items[slot];
    let itm_grade = item_grade(itm);


    if (check_is_hardcore() && character.gold >= 1000000000) {
        if (!mode && itm.level >= 4)
            itm_grade = Math.max(itm_grade, 1);
        if (!mode && itm.level >= 5)
            itm_grade = 2;
    }


    const find_materials = mode
        ? find_or_buy2(mode + "scroll", 10 ** itm_grade)
        : find_or_buy2("scroll" + itm_grade);


    let offering_num = undefined;
    if (check_is_hardcore() && itm.level >= 7 && character.gold >= 1000000000) {
        offering_num = item_location2("offering");
    }

    return find_materials
        .then(_ev => upgrade(slot, _ev.num, offering_num));
}

var tracked_items = ["hpot0", "mpot0", "tracker", "hpot1", "mpot1", "elixirluck"];

var tracked_quants = {
    hpot0: 9995, hpot1: 9995,
    mpot0: 9995, mpot1: 9995,
    elixirluck: 5, tracker: 1,
    xpbooster: 1,
    luckbooster: 1,
    goldbooster: 1,
    computer: 1
};

function item_quant_key(item, char) {
    if (!char)
        char = character.name;
    return "char_" + char + "_" + item;
}

function track_item_quants() {
    var updates = {};
    tracked_items.forEach(item_name =>
        updates[item_quant_key(item_name)] = item_stack_size(item_name));
    updates["junk_" + character.name] = junk_count();
    updates["gold_" + character.name] = character.gold;
    aland_storage.eval_incoming(updates, true);
}

function buy_potions() {
    tracked_items.forEach(item => {
        positive_do(tracked_quants[item] - item_stack_size(item),
            amount => buy(item, amount));
    });
}

function refill_party() {
    for (let something of parent.X.characters) {
        let name = something.name;
        if (!parent.entities[name]) continue;
        if (character.gold >= 100000000 && aland_storage.get("gold_" + name) < 40000000)
            send_gold(name, 40000000 - aland_storage.get("gold_" + name));
        tracked_items.forEach(item => {
            if (item_location(item) == null) return;
            positive_do(tracked_quants[item] - aland_storage.get(item_quant_key(item, name)),
                amount => send_item(name, item_location(item), amount));
        });
        if (name == "CodeGnampf" && item_location2("elixirdex0") >= 0) {
            send_item(name, item_location2("elixirdex0"), 1);
        }
    }
}

function junk_count() {
    let result = 0;
    for (var i = 0; i < 42; i++) {
        var current_item = character.items[i]
        if (current_item && !tracked_quants[current_item.name])
            result++;
    }
    return result;
}


function dump_into_anna(anna_name) {//TODO dynamic merchant detection

    let count = 0;
    for (var i = 0; i < 42; i++) {
        var current_item = character.items[i]
        if (!current_item) continue;
        if ((character.ctype == "ranger" && current_item.name == "elixirdex0"))
            continue;
        if ((!["CodeSlut", "CodeGnampf"].includes(character.name) && current_item.level > 5) || current_item.name == "handofmidas")
            continue;
        //if other character poor and stuff is in autobuy
        if (auto_buy.get() && auto_buy.get()[current_item.name] && character.gold <= 12000000)
            continue;
        if (!tracked_quants[current_item.name]) {
            send_item(anna_name, i, current_item.q || 1);
            count++;
            if (count >= 20)
                break;
        }

    }
    if (character.gold > 0 && item_location2("computer") < 0)
        send_gold(anna_name, character.gold);
    else if (character.gold > 40000000) {
        send_gold(anna_name, character.gold - 40000000);
        //character.gold = 40000000;//update is not immediate, we fix this.
    } else if (aland_storage.get("gold_" + anna_name) <= 12000000)
        send_gold(anna_name, Math.max(4000000, (character.gold - aland_storage.get("gold_" + anna_name)) / 2));
    else if (character.gold > aland_storage.get("gold_" + anna_name))
        send_gold(anna_name, (character.gold - aland_storage.get("gold_" + anna_name)) / 2);
}

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function reflask_run() {
    return smart_move("bank")
        .catch(x => smart_move("bank"))
        .then(x => Sleep(500))
        .then(x => bank_safe())
        .then(x => Sleep(500))
        .then(x => smart_move("winter_inn"))
        .then(x => buy_potions())
        .then(x => visit_party());
}

function sort_all_bank(inv_indices, sorted_bank, i_running) {
    if (!character.bank) return log("Not inside the bank");
    if (!inv_indices) {
        inv_indices = []
        for (let i = 0; i < 42; i++) {
            if (!character.items[i])
                inv_indices.push(i);
        }
    }
    if (inv_indices.length == 0) return log("Make some space in inventory");
    if (!sorted_bank) {
        let bank_array = [];
        for (let bank_pack in character.bank) {
            if (bank_pack == "gold") continue;
            bank_array = bank_array.concat(character.bank[bank_pack]);
        }
        bank_array.sort(al_items.order.comparator);
        sorted_bank = {};
        for (let bank_pack in character.bank) {
            if (bank_pack == "gold") continue;
            sorted_bank[bank_pack] = bank_array.slice(0, 42);
            bank_array = bank_array.slice(42);
        }
    }
    if (i_running == null)
        i_running = 0;
    else
        i_running = (i_running + 1) % inv_indices.length;
    const inv_pointer = inv_indices[i_running];
    const inv_itm = character.items[inv_pointer];
    //check every
    if (!inv_itm) {
        for (let bank_pack in character.bank) {
            if (bank_pack == "gold") continue;
            for (let i = 0; i < 42; i++) {
                if (character.bank[bank_pack][i] && al_items.order.comparator(character.bank[bank_pack][i], sorted_bank[bank_pack][i])) {
                    log("Swapping empty " + inv_pointer + " with " + i + bank_pack);
                    parent.socket.emit("bank", {operation: "swap", pack: bank_pack, str: i, inv: inv_pointer});
                    return Sleep(150).then(x => sort_all_bank(inv_indices, sorted_bank, i_running));
                }
            }

        }
        inv_indices.splice(i_running, 1);
        return Sleep(150).then(x => sort_all_bank(inv_indices, sorted_bank, i_running));

        //good to go. slice off this party of shit and go on
    } else {
        for (let bank_pack in character.bank) {
            if (bank_pack == "gold") continue;
            for (let i = 0; i < 42; i++) {
                if (!al_items.order.comparator(inv_itm, sorted_bank[bank_pack][i]) && al_items.order.comparator(character.bank[bank_pack][i], sorted_bank[bank_pack][i])) {
                    log({operation: "swap", pack: bank_pack, str: i, inv: inv_pointer});
                    parent.socket.emit("bank", {operation: "swap", inv: inv_pointer, pack: bank_pack, str: i});
                    return Sleep(150).then(x => sort_all_bank(inv_indices, sorted_bank, i_running));
                }
            }
        }
    }

    //if is empty pull misplaced item
    //else if is full place misplaced item
    return sorted_bank;
}

function custom_pot_script() {
    if (safeties && mssince(last_potion) < min(200, character.ping * 3)) return;
    var used = false;
    if (new Date() < parent.next_skill.use_hp) return;
    var pots = ["hpot1", "hpot0", "mpot1", "mpot0"];
    var pot_vals = pots.map(pot => G.items[pot].gives[0][1]);
    pots = pots.map(pot => item_location(pot));
    var biggest_mpot = pots[2] != null ? pots[2] :
        pots[3] != null ? pots[3] : "use_mp";

    let proast = false;
    for (member in get_party()) {
        if (get_party()[member].type == "priest")
            proast = parent.entities[member];
    }

    if (character.mp / character.max_mp < 0.2)
        use(biggest_mpot), used = true;
    else if (proast && character.max_mp - character.mp >= pot_vals[2] && character.hp >= character.max_hp * 0.8)
        use(biggest_mpot), used = true;
    else if (character.max_hp - character.hp >= pot_vals[0] && pots[0] != null)
        use(pots[0]), used = true;
    else if (character.max_mp - character.mp >= pot_vals[2] && pots[2] != null)
        use(pots[2]), used = true;
    else if (character.max_hp - character.hp >= pot_vals[1] && pots[1] != null)
        use(pots[1]), used = true;
    else if (character.max_mp - character.mp >= pot_vals[3] && pots[3] != null)
        use(pots[3]), used = true;
    else if (pots[0] == null && pots[1] == null && character.max_hp - character.hp >= 50)
        use("use_hp"), used = true;
    else if (pots[2] == null && pots[3] == null && character.max_mp - character.mp >= 100)
        use("use_mp"), used = true;
    if (used) last_potion = new Date();
}

function taxi_dist(first, other) {
    let second = other || character;
    if (second.map != first.map) return 999999999;
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

const order = {}
al_items.order = order;

order.names = [
    "Helmets",
    "Armors",
    "Underarmors",
    "Gloves",
    "Shoes",
    "Capes",
    "Rings",
    "Earrings",
    "Amulets",
    "Belts",
    "Orbs",
    "Weapons",
    "Shields",
    "Offhands",
    "Elixirs",
    "Potions",
    "Scrolls",
    "Crafting and Collecting",
    "Exchangeables",
    "Others"
];
order.ids = [
    "helmet",
    "chest",
    "pants",
    "gloves",
    "shoes",
    "cape",
    "ring",
    "earring",
    "amulet",
    "belt",
    "orb",
    "weapon",
    "shield",
    "offhand",
    "elixir",
    "pot",
    "scroll",
    "material",
    "exchange",
    ""
];
order.item_ids = order.ids.map(_id => []);
object_sort(G.items, "gold_value").forEach(function (b) {
    if (!b[1].ignore)
        for (var c = 0; c < order.ids.length; c++)
            if (!order.ids[c] || b[1].type == order.ids[c] || "offhand" == order.ids[c] && in_arr(b[1].type, ["source", "quiver", "misc_offhand"]) || "scroll" == order.ids[c] && in_arr(b[1].type, ["cscroll", "uscroll", "pscroll", "offering"]) || "exchange" == order.ids[c] && G.items[b[0]].e) {
                order.item_ids[c].push(b[0]);
                break
            }
});
order.flat_iids = order.item_ids.flat();
order.comparator = function (a, b) {
    return ((a == null) - (b == null)) || (a != null) &&
        (order.flat_iids.indexOf(a.name) - order.flat_iids.indexOf(b.name) ||
            (a.name < b.name && -1 || +(a.name > b.name)) || (b.level - a.level));
}


function trades_to_csv(name) {
    const person = get_entity(name);
    if (!person || (!person.player && !person.me)) return;
    const trade_map = {};
    for (let i in person.slots) {
        const itm = person.slots[i];
        if (itm && itm.rid && !itm.b) {
            const lvl = (itm.level || 0);
            const quant = (itm.q || 1);
            if (!trade_map[itm.name]) trade_map[itm.name] = {};
            if (!trade_map[itm.name][lvl]) trade_map[itm.name][lvl] = {};
            if (!trade_map[itm.name][lvl][itm.price]) trade_map[itm.name][lvl][itm.price] = 0;
            trade_map[itm.name][lvl][itm.price] += quant;
        }
    }

    let result = ["Name,Level,Units,gold/unit"];
    for (let name in trade_map)
        for (let level in trade_map[name])
            for (let price in trade_map[name][level])
                result.push(G.items[name].name + ","
                    + level + "," + trade_map[name][level][price] + ","
                    + price);

    //show_json(result);
    return result.join("\n");
}