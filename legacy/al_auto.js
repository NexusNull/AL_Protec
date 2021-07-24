//const { log } = require("util");

window.auto_sell = new aland_storage.Char_key("_autosell");
window.auto_craft = new aland_storage.Char_key("_autocraft");
window.auto_exchange = new aland_storage.Char_key("_autoexchange");
window.auto_buy = new aland_storage.Char_key("_autobuy");
window.auto_ponty = new aland_storage.Char_key("_autoponty");

window.al_auto={};

let next_upgrade_level = 0;
let current_upgrade_level = 0;
let recent_craft_op = new Date();
//negative numbers essentially nullify the effect
const craft_op_timeout = -5;
let buy_blocker = false;
let _up_blocker=false;
let _comp_blocker = false;

function launch_task(slot, has_empty)
{//if i sucessfully do an upgrade i set incrementor to zero
//if i miss one due to level too low i set incrementor to -1(priority)
//if i miss one due to level too high i increment one
  const itm = character.items[slot];
  if(itm == null)
    return false;
  if(auto_sell.get() && auto_sell.get()[itm.name])
  {
    sell(slot,9999);
    return true;
  }
  
  if(!has_empty)
    return false;

  const itm_def = G.items[itm.name];
  let craft_target = (auto_craft.get() && auto_craft.get()[itm.name])
  
  if(!isNaN(craft_target))
    {craft_target={level:craft_target};}

  if(!craft_target && auto_exchange.get() && auto_exchange.get()[itm.name])
  {
    if(character.q.exchange || (itm_def.e > (itm.q || 1)))
      return false;
    else
    {
      exchange(slot);
      recent_craft_op = parent.future_ms(craft_op_timeout);
      return true;
    }
  }
  
  if(craft_target == null && itm_def.compound)
    craft_target = {level:5};
  if(craft_target)
  {
    if(!_up_blocker && itm_def.upgrade && !character.q.upgrade && character.gold > 10000000)
    {
      if(craft_target.level > itm.level)
      {
        if(itm.level == current_upgrade_level)
        {
          _up_blocker = true;
          single_upgrade(slot)
            .finally(()=>_up_blocker=false);
          recent_craft_op = parent.future_ms(craft_op_timeout);
          return true;
        }
        else if(itm.level < current_upgrade_level)
        {
          next_upgrade_level = 0;
          return false;
        }
        else if(itm.level > current_upgrade_level)
        {
          if(next_upgrade_level == current_upgrade_level)
          {
            next_upgrade_level++;
          }
          return false;
        }
        
        
      }
      else if(craft_target.stat_type && craft_target.stat_type != itm.stat_type)
      {
        _up_blocker = true;
        single_upgrade(slot, craft_target.stat_type)
          .finally(()=>_up_blocker=false);
        recent_craft_op = parent.future_ms(craft_op_timeout);
        return true;
      }

    }
    else if(!_comp_blocker && itm_def.compound && !character.q.compound)
    {
      const maybe_compound = single_compound2(slot);
      if(maybe_compound)
      {
        recent_craft_op = parent.future_ms(craft_op_timeout);
        _comp_blocker = true;
        maybe_compound
          .finally(()=>_comp_blocker = false);
        return true;
      }
    }
      
    
  }
  return false;
}
let inventory_pointer = 0;
function next_inv()
{
  inventory_pointer++;
  inventory_pointer%=character.items.length;
}
function item_loop_logic()
{
  const has_empty = character.items.filter(x=>!x).length;
  const cur_ponty = auto_ponty.get();
  const ponty_b = parent.secondhands;
  if(!buy_blocker && has_empty > 1 && cur_ponty && ponty_b.length > 0 
    && parent.get_npc("secondhands") && distance(character,parent.get_npc("secondhands")) <= 400)
  {
    for(let i=0; i < ponty_b.length;i++)
    {
      const cur_offer = ponty_b[i];
      if(cur_offer.name in auto_ponty.get() && G.items[cur_offer.name].compound
        && (!auto_ponty.get()[cur_offer.name] || auto_ponty.get()[cur_offer.name] <= cur_offer.level))
      {
        log("Buying from Ponty " + cur_offer.name);
        buy_blocker = true;
        setTimeout(()=>buy_blocker = false,500);
        parent.secondhand_buy(cur_offer.rid);
        ponty_b.splice(i,1);
        return;
      }
    }
  }

  if(!buy_blocker && has_empty > 1 && cur_ponty && ponty_b.length > 0 
    && parent.get_npc("secondhands") && distance(character,parent.get_npc("secondhands")) <= 400)
  {
    for(let i=0; i < ponty_b.length;i++)
    {
      const cur_offer = ponty_b[i];
      if(cur_offer.name in auto_ponty.get()
        && (!auto_ponty.get()[cur_offer.name] || auto_ponty.get()[cur_offer.name] <= cur_offer.level))
      {
        log("Buying from Ponty " + cur_offer.name);
        buy_blocker = true;
        setTimeout(()=>buy_blocker = false,500);
        parent.secondhand_buy(cur_offer.rid);
        ponty_b.splice(i,1);
        return;
      }
    }
  }


  if(item_location2("computer") < 0 && taxi_dist(magic_spot) > 33)
    return;
  

  if(new Date() < recent_craft_op)
    return;

  next_upgrade_level = current_upgrade_level;
  for(let i in character.items)
  {
    next_inv();

    if(launch_task(inventory_pointer, has_empty))
      return;
    //else
    
  }
  current_upgrade_level = next_upgrade_level;
  const cur_buying = auto_buy.get();
  if(cur_buying && character.gold > 5000000 && !buy_blocker && has_empty > 1)
  {
    for(let buy_target in cur_buying)
    {
      const requested_amount = cur_buying[buy_target] || 1;
      if(item_stack_size(buy_target) < requested_amount)
      {
        buy_blocker = true;
        buy(buy_target)
          .finally(()=>buy_blocker = false);
        recent_craft_op = parent.future_ms(craft_op_timeout);
        return;
      }
        
    }
  }

  
  //

}
al_auto.craft = function(thing,level,stat_type) {
  if(!isNaN(thing))
  {
    if(!character.items[thing])
      return log("No item in slot #" + thing);
    thing = character.items[thing].name;
  }
  const result = stat_type ? {level:level,stat_type:stat_type}
  : level;
  const base = auto_craft.get() || {};
  base[thing] = result;
  auto_craft.set(base);
}

al_auto.sell = function(thing, undo) {
  if(!isNaN(thing))
  {
    if(!character.items[thing])
      return log("No item in slot #" + thing);
    thing = character.items[thing].name;
  }
  const base = auto_sell.get() || {};
  
  if(undo)
  {
    delete base[thing];
  }
  else
    base[thing] = true;

  auto_sell.set(base);
}

al_auto.exchange = function(thing, undo)
{
  if(!isNaN(thing))
  {
    if(!character.items[thing])
      return log("No item in slot #" + thing);
    thing = character.items[thing].name;
  }
  const base = auto_exchange.get() || {};
  if(undo)
  {
    delete base[thing];
  }
  else
    base[thing] = true;
  auto_exchange.set(base);
}

al_auto.weapon = function(_trg_val)
{
  if(_trg_val == null)
    return log("pls input argument");
  const w_cats = ["short_sword","staff","bow","fist"]
  const ret = Object.values(G.items).filter(x=>!x.ignore && x.type=="weapon" && w_cats.includes(x.wtype))
    .sort((a,b)=> a.tier - b.tier);
  
  const old_config = auto_craft.get() || {};
  const delta = {};
  for(let itm of ret)
  {
    let target_val = _trg_val;
    if(itm.tier > 1.5)
      target_val--;
    if(itm.tier > 2 || itm.ability == "freeze"|| itm.ability == "burn")
      target_val--;
    if(target_val <= 0)
      {delete old_config[itm.id];}
    else
      {delta[itm.id]=target_val;}
  }
  auto_craft.set(
    Object.assign(old_config, delta));
  return delta;
}

al_auto.armor = function(target_val,stat_type)
{
  if(target_val == null)
    target_val = 0;
  const high_val = target_val - 1;

  //type key
  const low_items = ["helmet","coat","pants","shoes","gloves"];
  const high_items = [];
  const low_sets = ["wanderers","rugged",
  "mpriest",
  "mmage",
  "mwarrior",
  "mranger",
  "mmerchant",
  "mrogue"];
  const high_sets = ["wt3","wt4"];
  Object.values(G.items)
    .filter(x=>low_sets.includes(x.set))
    .forEach(x=>low_items.push(x.id));
  Object.values(G.items)
    .filter(x=>high_sets.includes(x.set))
    .forEach(x=>high_items.push(x.id));


  const old_config = auto_craft.get() || {};
  const delta = {};

  //{level:4,stat_type:"dex"}
  for(let itm of low_items)
  {
    if(target_val <= 0)
      {delete old_config[itm];}
    else
      {delta[itm]=stat_type ? {level:target_val,stat_type:stat_type}
        : target_val}
  }

  for(let itm of high_items)
  {
    if(high_val <= 0)
      {delete old_config[itm];}
    else
      {delta[itm]=stat_type ? {level:high_val,stat_type:stat_type}
      : high_val}
  }
  //show_json(new_config);
  auto_craft.set(
    Object.assign(old_config, delta));
  return delta;
}

al_auto.class = function()
{
  const delta = {
    helmet:1,
    coat:1,
    pants:1,
    shoes:1,
    gloves:1};
  const class_map = {
    priest:"staff",
    mage:"staff",
    paladin:"mace",
    ranger:"bow",
    warrior:"wbasher",
    rogue:"claw"
  }
  if(class_map[character.ctype])
    {delta[class_map[character.ctype]] = 1;}
  auto_buy.set(
    Object.assign(auto_buy.get(), delta));
  return delta;
}
