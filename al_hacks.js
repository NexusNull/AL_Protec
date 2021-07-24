


function wofl(arr,i){
  return arr.slice(0,i).concat(arr.slice(i+1,arr.length));
}

function generate_routes(start,arr,cur = [],dist=0)
{
  if(cur.length >= 1)
    dist += simple_distance(start,cur[cur.length-1]);
  cur = cur.concat([start]);
  
  if(arr.length <= 0)
		return {cur,dist};
  
	
	let best = false;
	for(let i = 0; i < arr.length;i++)
	{
    const candidate = generate_routes(arr[i],wofl(arr,i),cur,dist);
    if(!best || candidate.dist < best.dist)
      best = candidate;
	}
  
	return best;
}

function ez_war()
{
  let trg_mobs = ["poisio"]
  if(character.ctype=="priest")
    trg_mobs = ["tortoise","frog","squigtoad"];
  setInterval(()=>{
    const wub = Object.values(parent.entities).filter(x=>trg_mobs.includes(x.mtype))
      .sort((a,b)=>simple_distance(character,a) - simple_distance(character,b));
    if(wub.length && can_attack(wub[0]))
      attack(wub[0]);
    if(wub.target && wub.target != character.name)
      use_skill("taunt",wub);
  },100);
  setInterval(()=>{
    const rwe = generate_routes(character,Object.values(parent.entities)
      .filter(x=>trg_mobs.includes(x.mtype)));
      
    const route = rwe.cur.slice(1).map(x=>({x:x.x,y:x.y,map:"main"}));
    if(route.length == 0) {
      if(!smart.moving) {
        smart_move("tortoise");
      }
      return;
    }
      
    //move(character.x,character.y);
    smart.plot = route;
    smart.found = true;
    smart.searching = false;
    draw_route();
    move(route[0].x, route[0].y);
  },500);
}

function draw_route()
{
  clear_drawings();
  const in_our_map = [character].concat(smart.plot.filter(x=>x.map == character.map));
  for(let i = 0; i < in_our_map.length-1; i++){
    draw_line(in_our_map[i].x,in_our_map[i].y,in_our_map[i+1].x,in_our_map[i+1].y);
  }
}

function ez_rang()
{
  setInterval(()=>{
    if(character.mp >= 300)
      use_skill("3shot");
    else {
      attack(get_nearest_monster());
    }
  },800);
}

function anna_dump() {
  if(!parent.entities.CodeAnna)
    return;
  for(let i = 0; i < 28; i++)
    if(character.items[i] && (character.items[i].level || 0) < 5)
      send_item("CodeAnna",i,9999);
}

function sort_dump() {
  let trg;
  trg = "CodeSlut"
  if(parent.entities[trg]) {
    for(let i = 0; i < 28; i++)
      if(character.items[i] && (character.items[i].level || 0) < 5)
        if(character.items[i].name.includes("int"))
          send_item(trg,i,9999);
  }
  trg = "CodeGorm"
  if(parent.entities[trg]) {
    for(let i = 0; i < 28; i++)
      if(character.items[i] && (character.items[i].level || 0) < 5)
        if(character.items[i].name.includes("str"))
          send_item(trg,i,9999);
  }
  trg = "CodeGnampf"
  if(parent.entities[trg]) {
    for(let i = 0; i < 28; i++)
      if(character.items[i] && (character.items[i].level || 0) < 5)
        if(character.items[i].name.includes("dex"))
          send_item(trg,i,9999);
  }
}

al_economy = {};
al_economy.craft = {
	"helmet": 8,
  "gloves": 8,
  "shoes": 8,
  "coat": 9,
  "pants": 9,
  "claw":8,

	"wattire": 8,
	"wbreeches": 8,
  "wgloves": 8,
  "wcap": 8,
	"wshoes": 8,
	
  "stinger": 6,
	
	"hpbelt": 4,
  "hpamulet": 4,
  "ringsj": 4,

  "strring": 3,
  "dexring": 3,
  "intring": 3,

	"strearring": 3,
	"stramulet": 3,
	"strbelt": 3,
	
	"dexearring": 3,
	"dexamulet": 3,
	"dexbelt": 3,
	
	"intearring": 3,
	"intamulet": 3,
	"intbelt": 3
};


(function(){
  const pf_cd = new al_util.Timeout(5000);
  function pathfinding_service() {
    const include_town = false;
    const optimise_path = true;
    if(smart.searching && !smart.found
      && pf_cd.unlocked()) {
        fetch(`https://almap.zinals.tech/index.php/api/FindPath?fromX=${character.x}&fromY=${character.y}&toX=${smart.x}&toY=${smart.y}&fromMap=${character.map}&toMap=${smart.map}&useTown=${include_town}&optimisePath=${optimise_path}`)
          .then(response => response.json())
          //.then(x=>{show_json(x);return x})
          .then(json=>{
            let cur_map = character.map;
            return json.path.map(elem=>{
              const r = () => ({x:elem.x,y:elem.y,map:cur_map});
              if(elem.action =="Teleport") {
                cur_map = elem.action_target;
                return [{transport:true,map:cur_map,s:elem.target_spawn},r()];
              } else if(elem.action =="Town") {
                return [{town:true,map:cur_map},r()];
              }
              return [r()];
            });
          })
          .then(plot=>[].concat.apply([], plot))
          //.then(x=>{show_json(x);return x})
          .then(plot=>{
            if(!smart.found) {
              smart.plot = plot;
              
              smart.found = true;
              smart.searching = false;
              //show_json(plot);
            }
          });
        pf_cd.lock();
    }
  }
  al_util.register_behaviour(100,pathfinding_service);
})();

al_economy.sell = {
  "quiver": 0,
  "frankypants": 0,
};

function do_selling() {
  if(!al_items.item_lock.unlocked())
    return;
  if(simple_distance(character,magic_spot) > 33
    && al_items.locate("computer") < 0)
    return;
  const one_location = al_items.locate(null,itm=>itm 
    && itm.name in al_economy.sell && (itm.level||0) <= al_economy.sell[itm.name]);
  if(one_location >= 0) {
    const actions = [()=>sell(one_location),
        ()=>null,
        ()=>null];
      al_items.item_lock.execute(actions,true);
      log("sold " + one_location);
  }
}



function inv_and_bank()
{
  const pages = [character.items];
  for(let page_name in character.bank) {
    if(page_name=="gold")
      continue;
    pages.push(character.bank[page_name]);
  }

  return al_util.flatten(pages);
}

function pull_all_crafts() {
  const inv_map = al_items.semantic_inventory(inv_and_bank());
  const inv_view = [];
  for(let item_name in inv_map) {
    for(let item_level in inv_map[item_name]) {
      const locs = inv_map[item_name][item_level];
      inv_view.push(
        {name:item_name,
        level:item_level,
        q:locs[0],
        positions:locs[1]});
    }
  }
  const candidates = inv_view.filter(itm=>
    itm.name in al_economy.craft
      && itm.level < al_economy.craft[itm.name]);
  let compounds = candidates.filter(itm=>
    G.items[itm.name].compound
      && itm.q >= 3);
  let upgrades = candidates.filter(itm=>
    G.items[itm.name].upgrade);


  let empty_slots = al_items.free_slots();
  const actions = [];

  function make_actions(comp, cnt) {
    //show_json(Object.keys(comp.positions));
    Object.keys(comp.positions).slice(0,cnt).forEach(pos=>{
      //log(pos);
      if(pos >= 42) {
        const n_pos = pos - 42;
        const [b_pack,b_slot] = [Object.keys(character.bank)[n_pos / 42 >> 0],n_pos%42];
        //actions.push([b_pack,b_slot]);
        actions.push(()=>
          parent.socket.emit("bank",{operation:"swap",
          pack:b_pack,str:b_slot,inv:-1}));
      }
        
      delete comp.positions[pos];
      comp.q -= 1;
      empty_slots -= 1;
    });
  }

  //for(let i = 0; i < 2; i++) {
  while(empty_slots > 3
    && compounds.length > 0) {
      //show_json(compounds);
      make_actions(compounds[0],3);
      compounds = compounds.filter(itm=>
        itm.q >= 3);
  }

  while(empty_slots > 1
    && upgrades.length > 0) {
      //show_json(compounds);
      make_actions(upgrades[0],1);
      upgrades = upgrades.filter(itm=>
        itm.q >= 1);
  }

  //show_json(actions[0].toString());
  return al_items.item_lock.execute(actions,true);
  
  //return [compounds,upgrades, actions];
}

globalThis.magic_spot = {"map":"main","x":-101,"y":-122};

async function compound_lattice(inv_slot,ref_price,reverse=false) {
  const itm = character.items[inv_slot];
  const all_itms = al_util.range(42).filter(x=>character.items[x]?.name == itm.name && character.items[x].level == itm.level);

  function calc_price(scroll_price,off_price,chance) {
    return (3 * ref_price + scroll_price + off_price) / chance;
  }
  function reverse_calc_price(scroll_price,off_price,chance) {
    return (ref_price * chance - off_price - scroll_price) / 3;
  }
  const scroll_locs = [0,1,2].filter(x=>x>= item_grade(itm))
    .map(x=>al_items.locate("cscroll"+x));
  const off_locs = [-1].concat(["offeringp","offering"].map(x=>al_items.locate(x)));
  const off_prices = [0,2_500_000,G.items.offering.g];
  function gname(i) {
    return character.items[i]?.name || "None";
  }

  const result = {};

  for(let scr of scroll_locs) {
    for(let off_i in off_locs) {
      const scr_name = gname(scr);
      const chance = (await parent.compound(all_itms[0],all_itms[1],all_itms[2],scr,off_locs[off_i],true,true)).chance;
      result[[scr_name,gname(off_locs[off_i])]] = (reverse && reverse_calc_price || calc_price)(G.items[scr_name].g,off_prices[off_i],chance);
    }
  }

  const result2 = Object.entries(result).sort((a,b)=>a[1] - b[1]);
  if(reverse) result2.reverse();

  show_json(result2); 
}

//function upgrade(item,scroll,offering,code,calculate)
async function upgrade_lattice(inv_slot,ref_price,reverse=false) {
  const itm = character.items[inv_slot];

  function calc_price(scroll_price,off_price,chance) {
    return (ref_price + scroll_price + off_price) / chance;
  }
  function reverse_calc_price(scroll_price,off_price,chance) {
    return (ref_price * chance - off_price - scroll_price);
  }
  const scroll_locs = [0,1,2].filter(x=>x>= item_grade(itm))
    .map(x=>al_items.locate("scroll"+x));
  const off_locs = [-1].concat(["offeringp","offering"].map(x=>al_items.locate(x)));
  const off_prices = [0,2_500_000,G.items.offering.g];
  function gname(i) {
    return character.items[i]?.name || "None";
  }

  const result = {};

  for(let scr of scroll_locs) {
    for(let off_i in off_locs) {
      const scr_name = gname(scr);
      const chance = (await parent.upgrade(inv_slot,scr,off_locs[off_i],true,true)).chance;
      result[[scr_name,gname(off_locs[off_i])]] = (reverse && reverse_calc_price || calc_price)(G.items[scr_name].g,off_prices[off_i],chance);
    }
  }

  const result2 = Object.entries(result).sort((a,b)=>a[1] - b[1]);
  if(reverse) result2.reverse();

  show_json(result2); 
}

function do_crafting() {
  if(!al_items.item_lock.unlocked())
    return;
  if(simple_distance(character,magic_spot) > 33
    && al_items.locate("computer") < 0)
    return;
  const inv_map = al_items.semantic_inventory(character.items);
  const inv_view = [];
  for(let item_name in inv_map) {
    for(let item_level in inv_map[item_name]) {
      const locs = inv_map[item_name][item_level];
      inv_view.push(
        {name:item_name,
        level:item_level,
        q:locs[0],
        positions:locs[1]});
    }
  }
  const candidates = inv_view.filter(itm=>
    itm.name in al_economy.craft
      && itm.level < al_economy.craft[itm.name]);
  let compounds = candidates.filter(itm=>
    G.items[itm.name].compound
      && itm.q >= 3);
  let upgrades = candidates.filter(itm=>
    G.items[itm.name].upgrade);

  if(compounds.length > 0 && !character.q.compound) {
    const itm = compounds[0];
    const wofl = Object.keys(itm.positions)
    al_util.log("combining " + JSON.stringify(itm));
    return al_items.item_lock.execute(()=>
      compound(wofl[0],wofl[1],wofl[2],al_items.locate("cscroll"+item_grade(itm)))); 

    //item_grade(item)
    //function compound(item0, item1, item2, scroll_num,
  }

  if(upgrades.length > 0 && !character.q.upgrade) {
    const itm = upgrades[0];
    const wofl = Object.keys(itm.positions)
    return al_items.item_lock.execute(()=>
      upgrade(wofl[0],al_items.locate("scroll"+item_grade(itm)))); 
    //item_grade(item)
    //function compound(item0, item1, item2, scroll_num,
  }

  

  //show_json(actions[0].toString());
  
}

function desire_scrolls() {
  return {scroll0:5,scroll1:5,cscroll0:5,cscroll1:5};
}

function bank_lul() {
  const page_names = Object.keys(character.bank)
    .filter(x=>x!="gold");
  const pages = al_util.flatten(page_names.map(x=>character.bank[x]));
  

  const res = [];
  function make_insert(inv_slot,bank_slot) {
    al_util.log("putting " + inv_slot + " into " +  page_names[bank_slot / 42 >> 0]);
    const itm = character.items[inv_slot];
    if(pages[bank_slot]) {
      pages[bank_slot].q += itm.q || 1;
    } else {
      pages[bank_slot] = itm;
    }
    return ()=>parent.socket.emit("bank", {
      operation: "swap",
      pack: page_names[bank_slot / 42 >> 0],
      str: -1,
      inv: inv_slot
    });
  }

  let store_slots = al_util.range(28).filter(x=>character.items[x]);
  store_slots = store_slots.filter(x=>{
    for(let i of al_util.range(pages.length)) {
      if (can_stack(pages[i], character.items[x])) {
        res.push(make_insert(x,i));
        return false;
      }
    }
    return true;
  });
  store_slots.filter(x=>{
    for(let i of al_util.range(pages.length)) {
      if (!pages[i]) {
        res.push(make_insert(x,i));
        return false;
      }
    }
    return true;
  });
  //show_json(store_slots);
  return al_items.item_lock.execute(res,true);
}

function roundtrip() {
  //show_json("Im going");
  const backo = parent.X.characters.map(x=>x.name).filter(x=>al_social.party()[x] && x != character.name)
  //show_json(backo);
  let tsk = backo.reduce( (p, char_name) => 
    p.then(()=>{
      //show_json(get_party()[char_name]);
      return smart_move(al_social.party()[char_name])
    })
  , Promise.resolve("Yay") );

  tsk = tsk
    .catch(x=>3)
    .then(x=>smart_move("bank"))
    .catch(x=>null)
    .then(x=>smart_move("bank"))
    .then(x=>al_util.sleep(159))
    .then(x=>bank_lul())
    .then(x=>pull_all_crafts())
    .then(x=>smart_move(magic_spot));
}

let may_move = false;

function tiny_fairy() {
  let ents = Object.values(parent.entities)
    .filter(x=>x.mtype == "tinyp")
    .filter(x=>x.map == character.map)
    .filter(x=>!x.dead)
    .sort((a,b)=>simple_distance(character,a)-simple_distance(character,b));
  if(ents.length > 0) {
    const trg = ents[0];
    if(!is_moving(character)) {
      if(character.ctype == "warrior" || character.ctype == "rogue" ) {
        xmove(trg.x,trg.y);
      } else {
        xmove(trg.x + Math.random() * 100 - 50,trg.y + Math.random() * 100 - 50);
      }

      if(is_in_range(trg)) {
        if(character.ctype == "warrior" && !is_on_cooldown("stomp")) {
          bash();
        }
        if(trg.s.stunned) {
          if(character.ctype == "priest" && !is_on_cooldown("curse")) {
            use_skill("curse",trg);
          }
          if(character.ctype == "ranger" && !is_on_cooldown("huntersmark")) {
            use_skill("huntersmark",trg);
          }
          if(character.ctype == "ranger" && !is_on_cooldown("supershot")) {
            use_skill("supershot",trg);
          }
          if(can_attack(trg)) {
            attack(trg);
          }
        }
      }
    }
    return true;
  }
  return false;
}

let franky = null;

function info_franky() {
  fetch('https://www.aldata.info/api/ServerStatus').then(response => {
    response.json().then(data => {
      const result = data.filter(e => e.server_identifier !== 'PVP' && e.eventname === 'franky' && e.live && e.target)
        .map(x=>x.server_region+x.server_identifier);
      if(result.length) {
        //stop moving
        smart.moving = false;
      }
      franky = result;
    });
  });
}



info_franky();

const franky_lock = new al_util.Timeout(2000);
/*franky_lock._next_op = Date.now() + 30000;*/
const rev_franky_lock = new al_util.Timeout(20_000);

function farm_franky() {
  if(!franky_lock.unlocked())
    return false;
  if(!franky)
    return false;
  const potential_f = franky?.find(x=>x);
  if(potential_f) {
    rev_franky_lock.lock();
    if(parent.server_region + parent.server_identifier != potential_f) {
      franky_lock.lock();
      al_util.log("Hopping to franky in " + potential_f);
      al_deploy.deploy(null,potential_f);
      return true;
    }
    if(parent.S.franky) {
      attack_franky();
      return true;
    }
  } else if(rev_franky_lock.unlocked() && parent.server_region + parent.server_identifier != "EUI") {
    franky_lock.lock();
    al_util.log("No franky. going to EUI");
    al_deploy.deploy(null,"EUI");
  }
  return false;
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
order.item_ids = order.ids.map(_id=>[]);
object_sort(G.items, "gold_value").forEach(function(b) {
  if (!b[1].ignore)
    for (var c = 0; c < order.ids.length; c++)
      if (!order.ids[c] || b[1].type == order.ids[c] || "offhand" == order.ids[c] && in_arr(b[1].type, ["source", "quiver", "misc_offhand"]) || "scroll" == order.ids[c] && in_arr(b[1].type, ["cscroll", "uscroll", "pscroll", "offering"]) || "exchange" == order.ids[c] && G.items[b[0]].e) {
        order.item_ids[c].push(b[0]);
        break
      }
});
order.flat_iids = order.item_ids.flat();
order.comparator = function(a,b) {
  return ((a==null)-(b==null)) || (a!=null)&&
  (order.flat_iids.indexOf(a.name)-order.flat_iids.indexOf(b.name)|| 
  (a.name < b.name && -1 || +(a.name > b.name)) || (b.level-a.level));
}

function sort_all_bank(inv_indices, sorted_bank, i_running)
{
  if(!character.bank) return log("Not inside the bank");
  if(!inv_indices)
  {
    inv_indices = []
    for(let i = 0; i < 42; i++)
    {
      if(!character.items[i])
        inv_indices.push(i);
    }
  }
  if(inv_indices.length == 0) return log("Make some space in inventory");
  if(!sorted_bank)
  {
    let bank_array = [];
    for(let bank_pack in character.bank)
    {
      if(bank_pack == "gold") continue;
      bank_array = bank_array.concat(character.bank[bank_pack]);
    }
    bank_array.sort(order.comparator);
    sorted_bank={};
    for(let bank_pack in character.bank)
    {
      if(bank_pack == "gold") continue;
      sorted_bank[bank_pack] = bank_array.slice(0,42);
      bank_array = bank_array.slice(42);
    }
  }
  if(i_running == null)
    i_running = 0;
  else
    i_running = (i_running + 1) % inv_indices.length;
  const inv_pointer = inv_indices[i_running];
  const inv_itm = character.items[inv_pointer];
  //check every 
  if(!inv_itm)
  {
    for(let bank_pack in character.bank)
    {
      if(bank_pack == "gold") continue;
      for(let i = 0; i < 42; i++)
      {
        if(character.bank[bank_pack][i] && order.comparator(character.bank[bank_pack][i],sorted_bank[bank_pack][i]))
        {
          log("Swapping empty "+inv_pointer+" with "+i+bank_pack);
          parent.socket.emit("bank",{operation:"swap",pack:bank_pack,str:i,inv:inv_pointer});
          return al_util.sleep(150).then(x=>sort_all_bank(inv_indices,sorted_bank,i_running));
        }
      }

    }
    inv_indices.splice(i_running,1);
    return al_util.sleep(150).then(x=>sort_all_bank(inv_indices,sorted_bank,i_running));

    //good to go. slice off this party of shit and go on
  }
  else
  {
    for(let bank_pack in character.bank)
    {
      if(bank_pack == "gold") continue;
      for(let i = 0; i < 42; i++)
      {
        if(!al_items.order.comparator(inv_itm,sorted_bank[bank_pack][i]) && al_items.order.comparator(character.bank[bank_pack][i],sorted_bank[bank_pack][i]))
        {
          log({operation:"swap",pack:bank_pack,str:i,inv:inv_pointer});
          parent.socket.emit("bank",{operation:"swap",inv:inv_pointer,pack:bank_pack,str:i});
          return al_util.sleep(150).then(x=>sort_all_bank(inv_indices,sorted_bank,i_running));
        }
      }
    }
  }

  //if is empty pull misplaced item
  //else if is full place misplaced item
  return sorted_bank;
}


function attack_franky() {
  let ents = Object.values(parent.entities)
    .filter(x=>x.mtype == "franky")
    .filter(x=>x.map == character.map)
    .filter(x=>!x.dead)
    .filter(x=>x.target);

  if(ents.length) {
    const trg = ents[0];

    if(!is_moving(character)) {
      xmove(trg.x - 30,trg.y);
    }

    if(is_in_range(trg)) {
      if(character.ctype == "warrior" && !is_on_cooldown("stomp") && !trg.s.stunned) {
        bash();
      }
      if(character.ctype == "priest" && !is_on_cooldown("curse") && !trg.s.cursed) {
        use_skill("curse",trg);
      }
      if(character.ctype == "ranger" && !is_on_cooldown("huntersmark") && !trg.s.marked) {
        use_skill("huntersmark",trg);
      }
      if(character.ctype == "ranger" && !is_on_cooldown("supershot")) {
        use_skill("supershot",trg);
      }
      if(character.ctype =="warrior" && !is_on_cooldown("warcry") && !character.s.warcry) {
        use_skill("warcry");
      }
      if(character.ctype =="priest" && !is_on_cooldown("darkblessing") && character.s.warcry && !character.s.darkblessing) {
        use_skill("darkblessing");
      }
      if(can_attack(trg)) {
        attack(trg);
      }
      
    }
    
    return true;
  } else if(!is_moving(character)) {

    if(character.map == "halloween") {
      smart_move({map:"halloween",x:-1050,y:-1500})
        .then(x=>transport("level1",2));
    } else {
      smart_move(parent.S.franky);
    }    
  }
  return false;
}

function equip_swords() {
  //equip the "best" swords.
  if(!al_items.item_lock.unlocked())
    return;
  let sword_locs = al_items.locate_all(null,x=>x 
    && ["short_sword","sword"].includes(G.items[x.name].wtype) && x.level > 5)
    .sort((a,b)=>character.items[b].level - character.items[a].level);
  //if offhand empty unequip
  if(!character.slots.mainhand||G.items[character.slots.mainhand.name].wtype == "basher")
  {
    
    if(sword_locs.length >= 2)
    {
      const actions = [()=>equip(sword_locs[0],"mainhand"),
        ()=>equip(sword_locs[1],"offhand")];
      al_items.item_lock.execute(actions,true);
    }
  } else if(!character.slots.offhand) {
    if(sword_locs.length >= 1)
    {
      al_items.item_lock.execute(()=>equip(sword_locs[0],"offhand"));
    }
  }
}

function equip_gloves() {
  if(al_looting.is_looting()) {
    return;
  }
  if(!al_items.item_lock.unlocked())
    return;
  const [gloves_level,gloves_locations] = al_items.locate_max_level(null,itm=>itm && G.items[itm.name].type=="gloves");
  if(gloves_level >= 0 && !gloves_locations.includes("gloves")) {
    al_items.item_lock.execute(()=>equip(gloves_locations[0]));
    return;
  }
}

function lenient_is_cooldown(skill) {
	if(G.skills[skill] && G.skills[skill].share) return lenient_is_cooldown(G.skills[skill].share);
	if(parent.next_skill[skill] && new Date(Date.now() + 500)<parent.next_skill[skill]) return true;
	return false;
}


function bash() {
  //equip basher and stomp
  if(character.slots.mainhand&&G.items[character.slots.mainhand.name].wtype == "basher")
  {
    use_skill("stomp");
  } else if(al_items.item_lock.unlocked()) {
    const bash_loc = al_items.locate(null,x=>x 
      && G.items[x.name].wtype == "basher")
      if(bash_loc >= 0) {
        const actions = [()=>unequip("offhand"),
          ()=>equip(bash_loc),
          ()=>use_skill("stomp")];
        al_items.item_lock.execute(actions,true);
      }
    
  }
}

function crap(){

  if(tiny_fairy()) {
    return;
  }

  if(farm_franky()) {
    return;
  }

  

  may_move = !may_move;
  const meat_shields = ["Clover","NexusNull","Arcus"];
  let ents = Object.values(parent.entities)
    .filter(x=>meat_shields.includes(x.target) || al_social.party()[x.target])
    
    .filter(x=>!x.dead)
    .sort((a,b)=>simple_distance(character,a)-simple_distance(character,b));

    /*
  //TODO this educes xp gain cause we already extinction the scorps.
  const alive_ents = ents.filter(mon=>{
    const burn = mon.s.burned;
    return !burn || mon.hp > (Math.floor(burn.ms / G.conditions.burned.interval)*burn.intensity) / 5;
  });
  if(alive_ents.length) {
    ents = alive_ents;
  }*/
  //
  //if(!burn) return false;
  //

  
  const ents2 = ents.filter(x=>is_in_range(x));
  if(character.ctype !="warrior" && character.ctype !="rogue") {
    ents = ents.filter(x=>is_in_range(x));
  }

  if(!al_social.party().NexusNull && !smart.moving) {
    smart_move("halloween");
  } else if(ents.length <= 0 && al_social.party().NexusNull && !smart.moving) {
    const frup = parent.entities.NexusNull || al_social.party().NexusNull;

    if(parent.entities.NexusNull && character.ctype == "warrior") {
      if(may_move) {
        xmove(-485.5,685.5);
        return;
      }
    }

    if(frup.map != character.map) {
      smart_move(frup);
    } else {
      xmove(frup.x,frup.y);
    }
  } else if (ents.length > 0) {
    if(may_move) {
      if(character.ctype == "warrior" || character.ctype == "rogue") {
        const warrior_mv = ents.find(x=>x.s.cursed) || ents[0];
        if(!smart.moving)
          xmove(warrior_mv.x,warrior_mv.y);
        if(character.ctype =="warrior" && !is_on_cooldown("charge") && simple_distance(character,warrior_mv) >= 115 && !ents2.length) {
          use_skill("charge");
        }
      } else if(parent.entities.NexusNull){
        const flu = parent.entities.NexusNull;
        move(flu.x,flu.y);
      }
    }

    if(character.ctype == "ranger" && ents2.length >= 3 && character.mp >= G.skills["3shot"].mp + G.skills.huntersmark.mp && can_attack(ents2[0])) {
      use_skill("3shot",ents2.slice(0,3).map(x=>x.id));
    } else if(can_attack(ents2[0]))
      attack(ents2[0]);
    const stronk = ents.sort((a,b)=>b.hp - a.hp)[0];
    //go 7 and 13
    if(character.ctype =="priest" && !is_on_cooldown("curse") && stronk.hp >= character.attack * 7) {
      use_skill("curse",stronk.id);
      send_cm(parent.X.characters.filter(c=>c.type=="ranger" && parent.entities[c.name]).map(c=>c.name),{hack_curse:stronk.id});
    }
  }

  if(character.ctype =="warrior" && !lenient_is_cooldown("warcry") && !Object.values(parent.entities).some(x=>x.ctype=="priest")) {
    use_skill("warcry");
  } 
  
  if(character.ctype =="priest" && !lenient_is_cooldown("darkblessing")) {
    use_skill("darkblessing");
    send_cm(parent.X.characters.filter(c=>c.type=="warrior" && parent.entities[c.name]).map(c=>c.name),{hack_dbless:true});
  } 
}

character.on("cm",event=>{
  if(!event.message?.hack_curse) 
    return;
  if(character.ctype =="ranger" && !is_on_cooldown("huntersmark") && is_in_range(parent.entities[event.message.hack_curse])) {
    use_skill("huntersmark",event.message.hack_curse);
  }
});

character.on("cm",event=>{
  if(!event.message?.hack_dbless) 
    return;
    if(character.ctype =="warrior") {
      use_skill("warcry");
    }
});

function mass_produce() {
  if(!character.s.massproduction)
    use_skill("massproduction");
}

function distribute_rspeed() {
  const players = Object.values(parent.entities).filter(x=>x.ctype);
  const targets = players.concat([character])
    .filter(x=>simple_distance(character,x) < G.skills.rspeed.range)
    .filter(x=>(x.s.rspeed?.ms||0) <= G.conditions.rspeed.duration * 8 / 9)
    .map(x=>x.name);
  if(targets.length) {
    use_skill("rspeed", targets[0]);
    //show_json(`using rspeed on ${targets[0]}`)
  }
}

function distribute_mluck() {
  const players = Object.values(parent.entities).filter(x=>x.ctype);
  const targets = players.concat([character])
    .filter(x=>simple_distance(character,x) < G.skills.mluck.range)
    .filter(x=>(x.s.mluck?.ms||0) <= G.conditions.mluck.duration * 11 / 12)
    .filter(x=>x.s.mluck?.f == character.name || !x.s.mluck?.strong)
    .map(x=>x.name);
  if(targets.length) {
    use_skill("mluck", targets[0]);
    //show_json(`using mluck on ${targets[0]}`)
  }
}

function draw_spawns()
{
  for(spawn of G.maps[character.map].monsters)
  {
    const bound = spawn.boundary;
    if(!bound) continue;

    const l_coords = [[0,1],[2,1],[2,3],[0,3]]
      .map(x=>[bound[x[0]],bound[x[1]]]);

    for(let i = 0; i < 4; i++)
    {
      draw_line(l_coords[i][0],l_coords[i][1],
        l_coords[(i+1)%4][0],l_coords[(i+1)%4][1])
    }
  }
}

function influxify() {
    let xp_base=0;
    for (let i=1; i < character.level; i++) {
      xp_base+=G.levels[i];
    }
  al_influx.post_measure("stats",
    {character:character.name},
    {gold:character.gold,
      xp:character.xp,
      max_xp:character.max_xp,
      backed_xp:xp_base});
}
al_influx.post_measure("init",
  {character:character.name,
  realm:parent.server_region+parent.server_identifier},
  {success:1});
character.on("loot",function(data) {
  if(!data.items) {
    console.log("weird looting packet ",data);
  }
  if(!data.gone) {
    al_influx.post_measure("loot",
      {character:character.name},
      {gold:data.gold,
      goldm:data.goldm,
      itms:data.items.length});
  }
});

character.on("death",function(data) {
  al_influx.post_measure("death",
    {character:character.name},
    {suck:1});
});


//can check character.cc for suspiciousness

if(character.name == "CodeGorm") {
  //ez_war();
  al_util.register_behaviour(170,crap);
  al_util.register_behaviour(140,equip_swords);
  al_util.register_behaviour(140,equip_gloves);
}
  
if(character.name == "CodeSlut") {
  //ez_war();
  al_util.register_behaviour(170,crap);
}
if(character.name == "CodeGnampf") {
  //ez_war();
  al_util.register_behaviour(170,crap);
}
if(character.name == "CodeGra") {
  //ez_war();
  al_util.register_behaviour(170,crap);
  al_util.register_behaviour(333,distribute_rspeed);
}
if(character.name != "CodeAnna") {
  setInterval(anna_dump,5000);
  setInterval(sort_dump,5000);
  al_desires.register_desire(desire_scrolls);
  al_util.register_behaviour(11000,do_crafting);
  al_util.register_behaviour(34000,do_selling);
}
  
if(character.name == "CodeAnna")
{
  al_desires.register_desire(desire_scrolls);
  al_util.register_behaviour(300,do_crafting);
  al_util.register_behaviour(790,do_selling);
  al_util.register_behaviour(6 * 60 * 1000,roundtrip);
  al_util.register_behaviour(200,mass_produce);
  al_util.register_behaviour(333,distribute_mluck);
}

al_util.register_behaviour(29600,influxify);

al_util.register_behaviour(15000,info_franky);
  
