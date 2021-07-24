//looting, respawning, potions
'use strict';
globalThis.al_looting = (function(){
  const lut = {};
  const expose = make_exposure(lut);

  function mf_summary()
  {
    const [midas_level,midas_locations] = al_items.locate_max_level("handofmidas");

    const [booster_level,booster_locations] = al_items.locate_max_level(false,al_items.is_booster);

    const mid_def = G.items.handofmidas;
    const mboost = x => mid_def.gold + x * mid_def.upgrade.gold;

    const boos_def = G.items.goldbooster;
    const gboost = x => boos_def.gold + x * boos_def.compound.gold;
    //TODO send equipment gold info
    //TODO send tracktrix gold info
    return {
      ...(midas_level >= 0) && {midas_swap: mboost(midas_level)},
      ...(booster_level >= 0) && {booster: gboost(booster_level)}
    };
  }

  expose(
  function negotiate_mf(char_name)
  {
    return send_cm(char_name,
      {"al_mf": mf_summary()});
  });

  const mf_ring = new al_util.Ring(()=>
    Object.keys(al_social.party())
      .filter(x=>x!=character.name).sort());
  al_util.register_behaviour(2100,
  function update_mf_behaviour() {
    if(!character.party)
      return;
    lut.negotiate_mf(mf_ring.next());
    //al_util.log(JSON.stringify(mf_table));
  });

  const mf_table = {};

  character.on("cm",data=>{
    const pack = data.message?.al_mf;
    if(!pack)
      return;
    mf_table[data.name] = Object.values(pack)
      .reduce((a,b)=>a+b, 0);
  });

  function can_i_loot()
  {
    const own_mf = Object.values(mf_summary())
      .reduce((a,b)=>a+b, 0);
    const max_mf = Math.max(...
      Object.keys(al_social.near_party())
      .map(x=>mf_table[x] || 0));
    return own_mf >= max_mf;
  }

  function lootable_chests() {
    return Object.values(parent.chests)
      //filter to not recently looted
      .filter(chest=>(chest.al_last_loot || al_util.old_date()) + 1600 <= Date.now())
      //filter off chests with too many items in them
      //TODO improve this
      .filter(chest=>chest.items <= 0 || chest.items <= al_items.free_slots() - 1)
      //if we are the mfer loot nearby chests
      .filter(chest=>can_i_loot() && simple_distance(character,chest) <= 700
        //anyone can loot chests which are a minute old
        || chest.al_creation_date + 60 * 1000 <= Date.now());
  }

  const looting_cooldown = new al_util.Timeout(4200);
  expose(
  function is_looting() {
    return lootable_chests().length > 0 && looting_cooldown.unlocked();
  });

  al_util.register_behaviour(370,
  function looting_behaviour() {
    Object.values(parent.chests)
       .filter(chest=>!chest.al_creation_date)
       .forEach(chest=>chest.al_creation_date = Date.now());

    if(lut.is_looting())
    {
      const [midas_level,midas_locations] = al_items.locate_max_level("handofmidas");
      if(midas_level >= 0 && !midas_locations.includes("gloves")) {
        al_items.item_lock.execute(()=>equip(midas_locations[0]));
        return;
      }
      const [booster_level,booster_locations] = al_items.locate_max_level(false,al_items.is_booster);
      if(booster_level >= 0 && !booster_locations.some(loc=>character.items[loc].name=="goldbooster")) {
        al_items.booster_lock.execute(()=>shift(booster_locations[0],"goldbooster"));
        return;
      }
      
      const potential_chests = lootable_chests();
      potential_chests.slice(0,2)
        .forEach(chest=>{
          //loot said chest
          chest.al_last_loot = Date.now();
          parent.open_chest(chest.id);
        });
      if(potential_chests.length <= 2) {
        looting_cooldown.lock();
      }
    }
  });

  return lut;
})();