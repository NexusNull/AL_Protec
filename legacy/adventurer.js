//i feel like i want to maintain an escape route.
//and move exclusively on that route
//an escape route is a route to a transport.
//on start i swag move to iceland if in main or to main otherwise
//then filter
//when i switch zones the anchor of my escape route becomes the place where i switched zones
//when i retarget a mob i need to adjust my route towards him

//const { log } = require("util");

//const { log } = require("util");


/*
0.0745	0.167
0.0726	0.1564
0.0818	0.2091

5.739084*x - 0.2603921
is data for level 8 upgrading of grade:high items
x is without prim and y is with prim
*/

/*
Data for cclaw and hunt bow at level 7, with scroll1 and scroll2

0.1610404554445859	0.33559999999999995
0.15692587211125256	0.31189999999999996
0.19692587211125256	0.3719
0.2010404554445859	0.3956
0.20332633507421555	0.4087666666666667
0.1992117517408822	0.38506666666666667
0.1592117517408822	0.3250666666666666
0.16332633507421554	0.34876666666666667

It is very clear that scroll bonus is not amplified by prim. u can clearly see which upgrade belongs to which scroll
*/
//TODO proper csv exporter

setInterval(()=>{
  if(character.name=="CodeAnna" && !character.s.massproduction)
    use_skill("massproduction");
},200);

function say(message) // please use MORE responsibly, thank you! :)
{
	parent.say(message,safeties);
}

window.upgrade_research=[[],[]];
function up_datapoint(slot,grade)
{
  let itm = character.items[slot];
  grade = grade || item_grade(itm);
  let scroll_loc = item_location2("scroll"+grade);
  let off_loc = item_location2("offering");
  function formatofy()
  {
    let s = "";
    for(let i in upgrade_research[0])
      s += upgrade_research[0][i]+"\t"+upgrade_research[1][i]+"\n";
    return s;
  }
  //show_json([scroll_loc,off_loc]);
  return parent.upgrade(slot,scroll_loc,-1,"code",true)
    .then(x=>upgrade_research[0].push(x.chance))
    .then(x=>parent.upgrade(slot,scroll_loc,off_loc,"code",true))
    .then(x=>upgrade_research[1].push(x.chance))
    .then(x=>console.log(formatofy()));
}

/*
  //the check if we were engaged in pvp
//will recode And use as safety net in coding probably
if(character && next_skill.use_town>new Date())
  {add_log("Since you engaged another player in the last 3.6 seconds, If you leave now, You will be automatically defeated.","#E58859")}        
*/
//character.vision refers to the x,y dist an entitty can be away before it stops being tracked
function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

const up_chances = [1,0.98,0.95,0.7,0.6,0.4,0.25,0.15,0.07]
const fire_up_chances=[0.99998,0.97,0.94,0.68,0.58,0.38,0.24,0.14,0.066]
const midas_up_chances=[0.97,0.94,0.92,0.64,0.52,0.32];
function upping_price_of(item,level,base_gold)
{
  if(level == 0)
    return base_gold > 0 ? base_gold : G.items[item].g;
  const scroll_reg = "scroll"+item_grade({name:item,level:level-1})
  const cur_up_chances=item=="handofmidas" && midas_up_chances || (item.includes("fire") && fire_up_chances || up_chances);
  
  return (upping_price_of(item,level-1,base_gold) + G.items[scroll_reg].g)  / cur_up_chances[level-1];
}
upping_price_of.pp = function(item,level,base_gold)
{
  return show_json(numberWithCommas(upping_price_of(item,level,base_gold)));
}

function base_number_of(level)
{
  if(level == 0)
    return 1;
  return base_number_of(level -1) / up_chances[level-1];
}

function render_bank_items()
{
  if(!character.bank) return game_log("Not inside the bank");
  function itm_cmp(a,b)
  {
    return ((a==null)-(b==null)) || a&&(a.name < b.name ? -1 : +(a.name > b.name)) || a&&(b.level -a.level);
  }
  var a = [
    ["Helmets", []],
    ["Armors", []],
    ["Underarmors", []],
    ["Gloves", []],
    ["Shoes", []],
    ["Capes", []],
    ["Rings", []],
    ["Earrings", []],
    ["Amulets", []],
    ["Belts", []],
    ["Orbs", []],
    ["Weapons", []],
    ["Shields", []],
    ["Offhands", []],
    ["Elixirs", []],
    ["Potions", []],
    ["Scrolls", []],
    ["Crafting and Collecting", []],
    ["Exchangeables", []],
    ["Others", []]
  ],
  b = "<div style='border: 5px solid gray; background-color: black; padding: 10px; width: 434px'>";
  let slot_ids = [
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
  ""]
  let slot_cnts = {};
  object_sort(G.items, "gold_value").forEach(function(b) {
    if (!b[1].ignore)
      for (var c = 0; c < a.length; c++)
        if (!slot_ids[c] || b[1].type == slot_ids[c] || "offhand" == slot_ids[c] && in_arr(b[1].type, ["source", "quiver", "misc_offhand"]) || "scroll" == slot_ids[c] && in_arr(b[1].type, ["cscroll", "uscroll", "pscroll", "offering"]) || "exchange" == slot_ids[c] && G.items[b[0]].e) {
          //a[c][1].push({name:b[1].id});
          const dest_type = b[1].id;
          let type_in_bank=[];
          for(let bank_pock in character.bank)
          {
            const bank_pack = character.bank[bank_pock];
            for(let bonk_item in bank_pack)
            {
              const bank_item=bank_pack[bonk_item];
              if(bank_item && bank_item.name == dest_type)
                type_in_bank.push(bank_item);
            }
          }

          type_in_bank.sort(itm_cmp);
          slot_cnts[slot_ids[c]] = (slot_cnts[slot_ids[c]] || 0) + type_in_bank.length;
          //sucessive merge, flatten
          for(let io = type_in_bank.length - 1; io >= 1; io--)
          {
            if(itm_cmp(type_in_bank[io],type_in_bank[io-1]) == 0)
            {
              type_in_bank[io-1].q = (type_in_bank[io-1].q || 1) + (type_in_bank[io].q || 1);
              type_in_bank.splice(io,1);
            }
          }
          a[c][1].push(type_in_bank);
          break;
        }
  });
  let all_slorps = 0;
  for (var c = 0; c < a.length; c++)
  {
    a[c][0] = a[c][0]+": "+slot_cnts[slot_ids[c]];
    all_slorps += slot_cnts[slot_ids[c]];
    a[c][1] = a[c][1].flat();
  }
  a.push(["Total: "+all_slorps,[]]);
  //show_json(a);
  render_items(a);
}

function render_auto_items()
{
  const result = [["Auto-Craft",[]],["Auto-Exchange",[]],["Auto-Sell",[]],["Auto-Buy",[]],["Auto-Ponty",[]]];
  let bases = [auto_craft.get(),auto_exchange.get(),auto_sell.get(),auto_buy.get(),auto_ponty.get()]
  //
  for(let i = 0; i < bases.length; i++)
  {
    const cur_base = bases[i];
    if(!cur_base) continue;
    for(name in cur_base)
    {
      
      if((name in cur_base) && G.items[name])
      {
        
        const cur_represent = {name:name};
        if(!isNaN(cur_base[name]))
          cur_represent["level"] = cur_base[name];
        else if(cur_base[name] && cur_base[name].level)
          {cur_represent["level"] = cur_base[name].level;}
          
        result[i][1].push(cur_represent);
      }
        
    }
  }
  //show_json(result);
  render_items(result);
}

function render_items(a) {
  if(a.length > 0 && !Array.isArray(a[0]))
    {a=[["Items",a]]}
  let b = "<div style='border: 5px solid gray; background-color: black; padding: 10px; width: 434px'>";
  a.forEach(function(a) {
    b += "<div class='gamebutton gamebutton-small' style='margin-bottom: 5px'>" +
      a[0] + "</div>";
    b += "<div style='margin-bottom: 10px'>";
    a[1].forEach(function(a) {
      b += parent.item_container({
        skin: G.items[a.name].skin,
        onclick: "render_item_info('" + a.name + "')"
      }, a)
    });
    b += "</div>"
  });
  b += "</div>";
  parent.show_modal(b, {
    wrap: !1,
    hideinbackground: !0,
    url: "/docs/guide/all/items"
  })
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

function render_monsters(mons)
{
    var a = "";
    a += "<div style='width: 480px'>";
    mons.forEach(function(b) {
      if (!b[1].stationary && !b[1].cute || b[1].achievements) a += "<div style='background-color:#575983; border: 2px solid #9F9FB0; position: relative; display: inline-block; margin: 2px; /*" + b[0] + "*/' class='clickable' onclick='pcs(event); render_monster_info(\"" + b[0] + "\")'>", a = 1 > (G.monsters[b[0]].size || 1) ? a + parent.sprite(b[1].skin || b[0], {
          scale: 1
        }) : a + parent.sprite(b[1].skin || b[0], {
          scale: 1.5
        }), G.drops &&
        G.drops.monsters && G.drops.monsters[b[0]] && G.drops.monsters[b[0]].length && (a += "<div style='background-color:#FD79B0; border: 2px solid #9F9FB0; position: absolute; bottom: -2px; right: -2px; display: inline-block; padding: 1px 1px 1px 1px; height: 2px; width: 2px'></div>"), a += "</div>"
    });
    a += "</div>";
    parent.show_modal(a, {
      wrap: !1,
      hideinbackground: !0,
      url: "/docs/guide/all/monsters"
    })
  
}

if(parent.cli_require)
{
  if(!parent.is_cli)
  {
    setInterval(function(){
      if(!parent.character || !parent.code_run) return;
      parent.CLI_IN.forEach(function(m){
        if(m.type=="smart_move")
          cli_smart_move_result(m);
      });
      parent.CLI_IN=[];
    },50);
    if(parent.ls_emulation) window._localStorage=parent.ls_emulation;
    window.cli_require=parent.cli_require;
  }
  game.cli=true;
}


window.trg_viz = false;
function show_target()
{
  const borders = [
    0xF07F2F,
    0x44B75C,
	  0x3E6EED
	
  ];
  if(trg_viz)
    clearInterval(trg_viz);
  trg_viz = setInterval(x=>{
    clear_drawings();
  const flopp = window.more_att_targets.slice(-3);
  for(mobo in flopp)
  {
    const mob = flopp[mobo];
    if(mob)
    {
      draw_circle(mob.monster.real_x,mob.monster.real_y,8,16,0x8ac26d);
      draw_circle(mob.monster.real_x,mob.monster.real_y,16,3,borders[mobo]);
      //log(""+mob.x+" : " +mob.y);
    }
      
  }
    
  },100);
}

function burn_debug()
{
  setInterval(x=>{
    const mob = get_targeted_monster();
    if(mob && mob.s.burned)
    {
      //log(""+mob.hp +" : " +  Math.floor(mob.s.burned.ms / G.conditions.burned.interval)*mob.s.burned.intensity);
      //log(mob.s.burned.intensity /5);
      log(mob.s.burned.intensity);
    }
      
  },100);
}


//burning something:
/*
{
	"burned": {
		"ms": 2076,
		"intensity": 1615,
		"interval": 240,
		"f": "CodeHorst",
		"last": "2020-08-09T07:19:13.457Z"
	},
	"cursed": {
		"ms": 4534
	}
}*/
function cli_enable(char, disable)
{
  if(!char)
    char=character.name;
  parent.CLI_OUT.push({
    type:"cli_toggle_char",
    char:char,
    toggle:!disable
  });
}

function cli_disable(char)
  {cli_enable(char,true);}

if(!get_party()[character.name])
  re_party();

window.auto_m_sell = {helmet:{8:2000000},
                gloves:{8:2000000},
                coat:{8:2500000,
                      9:40000000},};
                

function find_sells()
{//parent.trade_sell("trade15","MoneyS","v6Rv",$(".tradenum").html())
//last arg shud be one. because one at a time
  for(person_n in parent.entities)
  {
    const person = parent.entities[person_n];
    if(!person.player) continue;
    for(let i in person.slots)
    {
      const itm = person.slots[i];
      //if(itm && itm.b && Math.random() < 0.3)
        //show_json(itm);
      /*if(itm && itm.b && auto_m_sell[itm.name])
        show_json([itm,auto_m_sell[itm.name][itm.level],itm.price]);*/
        //join_giveaway("trade9","MoneyS","N7ap")

        /**
         * "trade2": {
		"name": "firebow",
		"level": 7,
		"price": 1,
		"rid": "bXaT",
		"giveaway": 22,
		"list": [
			"KoloMerchant",
			"CodeAnna",
			"CrownMerch",
			"MKMe",
			"Ploob",
			"Krag",
			"Foaly",
			"VanHalen",
			"Matiiiiin",
			"Matiiiiiin",
			"Matiiiin",
			"Matin",
			"CodeHorst",
			"CodeGnampf"
		]
	},
         */
      if(itm && itm.b && auto_m_sell[itm.name]
        && auto_m_sell[itm.name][itm.level])
      {
        if(itm.price >= auto_m_sell[itm.name][itm.level])
        {
          log("Found Seller:" + person_n);
          for(let j = 0; j < character.items.length; j++)
          {
            const my_itm = character.items[j];
            if(my_itm && my_itm.name==itm.name && my_itm.level==itm.level)
            {
              parent.trade_sell(i,person_n,itm.rid,1);
              log("Selling " + JSON.stringify(itm));
              aland_loggi.log("Selling "+ person_n + JSON.stringify(itm));
              return;
            }
          }
          //attempt to locate and sell
        }
      }
    }
  }
}

function pin_char()
{
  draw_line(character.x - 20, character.y - 20,character.x + 20, character.y + 20)
  draw_line(character.x - 20, character.y + 20,character.x + 20, character.y - 20)
}

function draw_taxi_circle(x,y,r)
{
  lolmid = {real_x:x,real_y:y};
  let points = [[0,1],[1,0],[0,-1],[-1,0]].map(_ev=>([x+_ev[0]*r,y+_ev[1]*r]));
  //show_json(points);
  for(let i = 0; i < 4; i++)
  {
    draw_line(points[i][0],points[i][1],points[(i+1)%4][0],points[(i+1)%4][1]);
  }
}

function draw_maxnorm_circle(x,y,r)
{
  lolmid = {real_x:x,real_y:y};
  let points = [[1,1],[1,-1],[-1,-1],[-1,1]].map(_ev=>([x+_ev[0]*r,y+_ev[1]*r]));
  //show_json(points);
  for(let i = 0; i < 4; i++)
  {
    draw_line(points[i][0],points[i][1],points[(i+1)%4][0],points[(i+1)%4][1]);
  }
}

var lolmid;
function vis_npc_range(name)
{
  const npc = parent.get_npc(name);
  if(npc)
    draw_circle(npc.x,npc.y,400);
}

//character.map=jail
function into_prison()
{
  let a = {
    x: -10000,
    y: -10000,
    going_x: -10000,
    going_y: -10000,
    m: character.m
  };
  parent.socket.emit("move", a);
}


function next_targets(gph)
{
  let target = Object.entries(parent.G.monsters)
  .map(([key,x])=>{
    var clone = Object.assign({}, x);
    delete clone.achievements;
    clone.id = key;
    clone.gold = Math.max(...Object.values(G.base_gold[key] || {"main":0}));
    clone.phys_hp = clone.hp * parent.damage_multiplier(clone.armor || 0)
    clone.gold_per_health = clone.gold / clone.phys_hp;
    clone.xp_per_health = clone.xp / clone.phys_hp;
    return [key,clone];})
  .filter(x=>x[1].phys_hp <= character.attack)
  .sort((a,b)=>{return b[1].xp - a[1].xp});
  render_monsters(target);
}

function monsters_stat(stat)
{
  render_monsters(Object.entries(G.monsters).filter(x=>x[1].achievements && x[1].achievements.some(y=>y[2]==stat)));
}

function hunter_quest()
{
  parent.socket.emit("monsterhunt");
}
function party_quest()
{
  obliteration_key.set_all("monsterhunter");
}

function deploy_characters(argument, undeploy)
{
  var names = ["CodeAnna","CodeHorst","CodeGnampf","CodeGorm"]
  for(var i in names)
  {
    if(character.name != names[i])
      if(!undeploy)
        start_character(names[i],argument);
      else
        stop_character(names[i]);
  }
}

function ex_deploy(argument)
{
  var names = ["CodeAnna","CodeHorst","CodeSlut","CodeGorm"]
  for(var i in names)
  {
    if(character.name != names[i])
      external_deploy(names[i]);
  }
}

var safety = null;
window.smart_comment = null;

function find_monster_packs(type)
{
  let locations=[];
  for(var name in G.maps)
    (G.maps[name].monsters||[]).forEach(function(pack){
      if(pack.type!=type || G.maps[name].ignore || G.maps[name].instance) return;
      if(pack.boundaries) // boundaries: for phoenix, mvampire
      {
        pack.last=pack.last||0;
        var boundary=pack.boundaries[pack.last%pack.boundaries.length];
        pack.last++;
        return boundary;
      }
      else if(pack.boundary)
      {
        var boundary=pack.boundary;
        locations.push([name].concat(boundary));
      }
    });
  return locations;
}

function find_random_pack(type)
{//shamelessly stolen from smart_move
  var locations=[],theone;
  locations = find_monster_packs(type);
  if(locations.length) // This way, when you smart_move("snake") repeatedly - you can keep visiting different maps with snakes
  {
    theone=random_one(locations);
    theone = locations[0];
    return theone;
    //smart.map=theone[0]; smart.x=theone[1]; smart.y=theone[2];
  }
  return null;
}

function player_is_aggro()
{
  return G.monsters[local_obliteration_value];
}

function tipple_move(to_x,to_y)
{
  var d_x = to_x - character.real_x
  var d_y = to_y - character.real_y
  var d_len = Math.sqrt(d_x * d_x + d_y * d_y)
  let flobb_len = 30;
  if(character.s.hardshell)
    flobb_len = 3;
  if(d_len <= flobb_len)
    return move(to_x,to_y);
  else
  {
    d_x = d_x / d_len
    d_y = d_y / d_len
    return move(character.x + d_x * flobb_len,
      character.y + d_y * flobb_len);
  }
  
}

function txdraw(x,y,tx,color,size)
{
  if(!game.graphics) return;
  if(!color) color=0x00F33E;
	if(!size) size=16;
  let a = new PIXI.Text(tx, {
    fontFamily: parent.SZ.font,
    fontSize: size,
    fontWeight: "bold",
    fill: color,
    align: "center"
  });
  a.type = "text";
  a.alpha = 1;
  a.x = round(x);
  a.y = round(y) + 0;
	parent.drawings.push(a);
	parent.map.addChild(a);
	return a;
}

window.npc_names={
  ponty:"secondhands",
  daisy:"monsterhunter",
  xyn:"exchange",
  exchange:"exchange",
  spencer:"pvptokens",
  tricksy:"funtokens",
  tavern:"tbartender",
  potions:"wbartender",
  gabe:"basics",
  scrolls:"scrolls",
  upgrade:"newupgrade",
  smith:"craftsman",
  cole:"mcollector",
  earrings:"pwincess"
}

/*

b = -1096.6666666666667
c = -940.9999847412109
Test island


*/

function open_npc(npc_id)
{
  if(!G.npcs[npc_id]) return log("That NPC does not exist.");
  const opener_proxy = Object.assign({},G.npcs[npc_id]);
  opener_proxy.npc_id = npc_id;
  opener_proxy.type = "npc";
  opener_proxy.x = character.x;
  opener_proxy.y = character.y;
  opener_proxy.npc = true;
  return parent.npc_right_click.call(opener_proxy);
}

const boss_list = ["phoenix","jr","mrgreen","fvampire","greenjr"];

function is_best_target(mob)
{
  if(character.name == "CodeGra") return false;
  return player_is_aggro() && mob && (boss_list.includes(mob.mtype));
}

function is_good_target(mob)
{
  if(local_obliteration_value == "_snek")
    return mob.mtype=="snake" || mob.mtype=="osnake";
  return mob.mtype == local_obliteration_value || is_best_target(mob);
}

window.circle_movement = null;
//{x,y,r}
function circle_move()
{
  if(circle_movement && character.ctype != "warrior")
  {
    let wurst_dest = safety;
    if(!(wurst_dest.map == character.map && Math.abs(wurst_dest.x-character.x) <= 25 && Math.abs(wurst_dest.y-character.y) <= 25))
      return;
    const angle_delta = 30 / circle_movement.r;
    const d_center_safety = {x:safety.x - circle_movement.x, y:safety.y - circle_movement.y};
    const new_angle = Math.atan2(d_center_safety.y,d_center_safety.x) + angle_delta;
    safety.x = circle_movement.x + circle_movement.r * Math.cos(new_angle);
    safety.y = circle_movement.y + circle_movement.r * Math.sin(new_angle);
  }
}

//TODO if best target is present move to that instead of safety
function simple_move(target) {
  //scouting behaviour
  if(smart_comment === -3 && smart.moving && !is_best_target(target))
    return;

  circle_move();

  let alt_best_target = null;
  for(let i = more_att_targets.length - 1; i >= 0; i--)
  {
    if(more_att_targets[i] && is_best_target(more_att_targets[i].monster))
    {
      alt_best_target = more_att_targets[i].monster;
      break;
    }
  }

  if (target && (!is_in_range(target) || (target.mtype && target.mtype.includes("fairy")) || (is_best_target(target) && local_obliteration_value != "xscorpion")) && is_good_target(target)) {
    if(smart_comment != target.id)
      stop("smart");
    let wurst_dest = target;
    if(wurst_dest.map == character.map && Math.abs(wurst_dest.x-character.x) <= 25 && Math.abs(wurst_dest.y-character.y) <= 25)
      return;
    if(character.map == target.map && can_move_to(target.real_x,target.real_y))
    {// Walk a few steps towards target
      //should read if we are targeting this or we are targeting nothing
        
      tipple_move(target.real_x + Math.random() * 50 - 25,target.real_y + Math.random() * 50 - 25);
    }
    else if(!smart.moving) 
    {
      smart_comment = target.id;
      smart_move({x:target.real_x,y:target.real_y});
    }
      
  }
  else if(!is_best_target(target) && alt_best_target)
    return simple_move(alt_best_target);
  //if we can directly go to safety do that and cancel any smarts
  //but if not use smart
  else if(safety)
  {
    if(smart_comment !== -7)
      stop("smart");
    let wurst_dest = safety;
    if(wurst_dest.map == character.map && Math.abs(wurst_dest.x-character.x) <= 25 && Math.abs(wurst_dest.y-character.y) <= 25)
      return;
    if(safety.map == character.map && can_move_to(safety.x,safety.y))
    {
      //potentially move to a point in between safety and mob
      //if distance between safety and mob <=character.range * 0.9
      if(target && distance(safety,target) > 0.9 * character.range)
      {
        
        var d_x = safety.x - target.real_x;
        var d_y = safety.y - target.real_y;
        var d_len = Math.sqrt(d_x * d_x + d_y * d_y)
        {
          d_x = d_x / d_len
          d_y = d_y / d_len
          return tipple_move(target.real_x + d_x * character.range * 0.9,
            target.real_y + d_y * character.range * 0.9);
        }
        
      }
      else if(circle_movement)
        tipple_move(safety.x,safety.y);
      else
        tipple_move(safety.x + Math.random() * 50 - 25,safety.y + Math.random() * 50 - 25);
    }
    else if(!smart.moving)
    {
      smart_comment = -7
      smart_move(safety);
    }
      
  } 
}

function bleargh()
{
  var b = "";
  b += "<div style='background-color: black; border: 5px solid gray; padding: 14px; font-size: 24px; display: inline-block; max-width: 640px'>";
  b += "<div style='padding: 10px; color: #CC863B; text-align: center'>Work in Progress</div>";
  "ranger rogue warrior mage priest paladin merchant".split(" ").forEach(function(a) {
    b += "<div>" + a.toTitleCase() + "</div>";
    parent.object_sort(G.skills).forEach(function(c) {
      let ident = c[0];
      c = c[1];
      c["class"] && c["class"].includes(a) && (b += parent.item_container({
        skin: c.skin,
        onclick: bloop_test(ident)
      }))
    })
  });
  b += "<div>Item Skills</div>";
  parent.object_sort(G.skills).forEach(function(a) {
    let ident = a[0];
    a = a[1];
    a.slot && (b += parent.item_container({
      skin: a.skin,
      onclick: bloop_test(ident)
    }))
  });
  b += "<div>Abilities and Utilities</div>";
  parent.object_sort(G.skills).forEach(function(a) {
    let ident = a[0];
    a = a[1];
    if ("ability" == a.type || "utility" == a.type) b += parent.item_container({
      skin: a.skin,
      onclick: bloop_test(ident)
    })
  });
  b += "</div>";
  parent.show_modal(b, {
    wrap: !1,
    hideinbackground: !0,
    url: "/docs/guide/all/skills_and_conditions"
  })
}


function bloop_test(skill)
{
  return "show_modal('<div id=\\'al_skill_preview\\' style=\\'width: 480px\\'></div>', {wrap: !1,hideinbackground: !0,});render_skill('#al_skill_preview', '"+skill+"');"
}


/*
function skill_click(a) {
  skillsui && keymap[a] && render_skill("#skills-item", keymap[a].name || keymap[a], keymap[a]);
  G.skills[a] && render_skill("#skills-item", a)
}

function show_condition(a) {
  a = G.conditions[a];
  show_modal(render_item("html", {
    skin: a.skin,
    item: a,
    prop: a
  }), {
    wrap: !1
  })
}

*/

window.obliteration_key = new aland_storage.Char_key("_obliteration_target");
var local_obliteration_value = false;
function obliterate(target_type) {
  log("Now targeting: " + target_type);
  if(target_type == "jrat" && character.map != "jail") 
    into_prison(); 

  if(G.monsters[local_obliteration_value])
    cached_local_target = local_obliteration_value;
  if(obliteration_key.get() != target_type)
    obliteration_key.set(target_type);

  local_obliteration_value = target_type;
  smart_comment = null;
  stop("move");
  
/*
window.dbugg = setInterval(x=>{
	clear_drawings();
	draw_circle(character.x,character.y,character.range);
},200);

*/


  //compute safeties here
  //hc server is HARDCORE
  //-250,690
  safety = null;
  circle_movement = null;
  if(target_type == "_snek")
  {
    safety = {x:-569,y:-511,map:"halloween"};
    return;
  }
  else if(target_type == "xscorpion")
  {
    circle_movement = {x:-485,y:685,r:90};
    if(character.ctype == "warrior")
      safety = {x:-485,y:616,map:"halloween"};
    else if(character.ctype == "ranger")
      safety = {x:-485,y:566,map:"halloween"};
    else
      safety = {x:-495,y:546,map:"halloween"};
    return;
  }
  else if(target_type == "prat")
  {
    circle_movement = {x:-11,y:114,r:70};
    safety = {x:0,y:124,map:"level1"};
    return;
  }
  else if(target_type == "crab")
  {
    safety = {x:-1202,y:-66,map:"main"};
    return;
  }
  //TODO remove this, it serves no purpose
  else if(target_type == "armadillo")
  {
    safety = {x:630,y:1810,map:"main"};
    return;
  }
  else if(target_type == "croc")
  {
    safety = {x:801,y:1710,map:"main"};
    return;
  }
  else if(target_type == "cgoo")
  {
    safety = {"x":-100,"y":-400,"map": "arena"};
  }
  else if(G.monsters[target_type])
  {
    let all_packs = find_monster_packs(target_type);
    
    
    for(let some_pack of all_packs)
    {
      //var some_pack = find_random_pack(target_type);
      var safe_map = some_pack[0];
      some_pack = some_pack.slice(1);
      var x_mid = (some_pack[0] +some_pack[2]) / 2;
      var y_mid = (some_pack[1] +some_pack[3]) / 2;
      //lower lower upper upper
      for(var i = 0; i < 4; i++)
      {
        if(i == 0 && target_type =="goo")
          i = 1;
        var x_safe, y_safe;
        if(i % 2 == 0)
        {//0,2 choose left or right
          x_safe = some_pack[i];
          y_safe = y_mid
          var x_safe_test = x_safe;
          if(G.monsters[target_type].hp >= 1500)
            x_safe_test += (-1 + i) * 100;
          if(can_move({map:safe_map,x:x_mid,y:y_mid,going_x:x_safe_test,going_y:y_safe,base:character.base}))
          {
            if(character.ctype != "warrior" && G.monsters[target_type].hp >= 1500)
            {
              x_safe += (-1 + i) * 60;
              
            }
              
            //y_safe += (Math.random() * 70 - 35)
            safety = {x:x_safe,y:y_safe,map:safe_map};
            //update safety
            return;
          }
        }
        else
        {
          x_safe = x_mid;
          y_safe = some_pack[i];
          var y_safe_test = y_safe;
          if(G.monsters[target_type].hp >= 1500)
            y_safe_test += (-2 + i) * 100;
          if(can_move({map:safe_map,x:x_mid,y:y_mid,going_x:x_safe,going_y:y_safe_test,base:character.base}))
          {
            if(character.ctype != "warrior" && G.monsters[target_type].hp >= 1500)
              y_safe += (-2 + i) * 60;

            //y_safe += (Math.random() * 70 - 35)
            safety = {x:x_safe,y:y_safe,map:safe_map};
            //update safety 
            return;
          }
        }
      }
    }
    //no safety found
    //safety automatically defaults to null, making seeking with smart_move possible.
  }
  else if(find_npc(target_type))
  {
    var l=find_npc(target_type);
    safety={map:l.map,x:l.x,y:l.y+15};
    return;
  }
}

const surv_components = realm_components(realm_key.get());



if(character.ctype == "merchant" && (parent.server_region == merchant_region && parent.server_identifier == merchant_server))
{
  smart_move("bank")
    .catch(x=>smart_move("bank"))
    .then(x=>Sleep(800))
    .then(x=>bank_pry())
    .then(x=>favorite_spot())
    .then(x=>Sleep(1000 * 60 * 5))
    .then(x=>smart_move("bank"))
    .then(x=>Sleep(800))
    .then(x=>bank_pry())
    .then(x=>favorite_spot())
    .then(x=>Sleep(1000 * 60 * 5))
    .then(x=>smart_move("bank"))
    .then(x=>Sleep(800))
    .then(x=>bank_pry())
    .then(x=>favorite_spot())
    .then(x=>Sleep(1000 * 60 * 5))
    .then(x=>smart_move("bank"))
    .then(x=>Sleep(800))
    .then(x=>bank_pry())
    .then(x=>favorite_spot())
    .then(x=>Sleep(1000 * 60 * 5))
    .then(x=>smart_move("bank"))
    .then(x=>Sleep(800))
    .then(x=>bank_pry())
    .then(x=>favorite_spot())
}
else if(character.ctype == "merchant" && (parent.server_region != surv_components[1] || parent.server_identifier != surv_components[2]))
{
  let excludes = [];
  function make_excludes(){
    return [...Array(42).keys()].filter(function(i){
      let itm = character.items[i];
      return (itm && itm.name in (auto_buy.get() || {}) && itm.name in (auto_craft.get() || {}) && itm.level < (auto_craft.get() || {})[itm.name])
    }).slice(0,8);
  }
  smart_move("cyberland")
    .catch(x=>smart_move("cyberland"))
    .catch(x=>3)
    .then(x=>smart_move("bank"))
    .catch(x=>smart_move("bank"))
    .catch(x=>3)
    .then(x=>excludes = make_excludes())
    .then(x=>bank_safe(excludes))
    .then(x=>bank_take())
    .then(x=>Sleep(300))
    .then(x=>favorite_spot())
    .then(x=>Sleep(26000))
    .then(x=>hop_next_realm())
}


if(parent.set_uroll && !parent.set_uroll._al_patched)
{
  const _al_uroll = parent.set_uroll;
  parent.set_uroll = function(a, b) {
    if(a.success || a.failure )
      {return _al_uroll(a,b);}
    if(a.nums.length == 4)
    {
      const super_fake = Object.assign({},a);
      super_fake.success = ((+(""+a.nums[3]+a.nums[2]+a.nums[1]+a.nums[0])) / 10000) < a.chance;
      super_fake.failure = !super_fake.success;
      return _al_uroll(super_fake,b);
    }
    var c = "#00.00",
    c = "<span style='color:" + "#868590" + ";'>" + c + "</span>";
    if (b) return c;
    $(".uroll").html(c)
  }
  parent.set_uroll._al_patched=true;
}

//TODO
//FIXME while fighting stuff like fvampire manual control is disabled

function visit_party()
{
  let backup_vis = null;
  const serv_components = realm_components(realm_key.get());
  for(let char of parent.X.characters.sort((a,b)=>aland_storage.get("junk_"+b.name)-aland_storage.get("junk_"+a.name)))
  {
    if(char.server && char.server == realm_key.get() && char.name != character.name)
    {
      if(char.name == obliteration_key.get())
        {backup_vis = char;}
      else {
      return smart_move(char)
        .then(x=>smart_move(parent.X.characters.find(x=>x.name==char.name)))
        .then(x=>obliteration_key.set(char.name))
        .then(x=>hop_server(serv_components[1],serv_components[2]));
      //return true;
      }
    }
  }
  if(backup_vis)
    return smart_move(backup_vis)
    .then(x=>obliteration_key.set(backup_vis.name))
    .then(x=>hop_server(serv_components[1],serv_components[2]));
  return hop_server(parent.server_region,parent.server_identifier);
}

function booster_shift(mode)
{
  const boosta = Math.max(item_location2("xpbooster"),
    item_location2("goldbooster"),
    item_location2("luckbooster"));
  if(mode)
  {
    if(boosta >= 0 && character.items[boosta].name != mode+"booster")
    {

      shift(boosta,mode+"booster");
      log("shifted to " + mode);
    }
  }
  else
  {
    if(boosta >= 0)
    {
      return character.items[boosta].name;
    }
  }
  return null;
}


  
function getMemory() {
  if(!parent.require) return;
  const {webFrame} = parent.require('electron')
  // `format` omitted  (pads + limits to 15 characters for the output)
  let format = x=>(""+x).padEnd(15," ");
  function logMemDetails(x) {
    function toMb(bytes) {
      return (bytes / (1000.0 * 1000)).toFixed(2)
    }

    console.log(
      format(x[0]),
      format(x[1].count),
      format(toMb(x[1].size) + "MB"),
      format(toMb(x[1].liveSize) +"MB")
    );
    /*
    aland_loggi.log(
      format(x[0])+
      format(x[1].count)+
      format(toMb(x[1].size) + "MB")+
      format(toMb(x[1].liveSize) +"MB")
    );*/
  }

  console.log(
    format("object"),
    format("count"),
    format("size"),
    format("liveSize")
  );
  /*
  aland_loggi.log(
    format("object")+
    format("count")+
    format("size")+
    format("liveSize"));*/
  Object.entries(webFrame.getResourceUsage()).map(logMemDetails)
  console.log('------')
  webFrame.clearCache()
  console.log('CLEARED Cache');
  aland_loggi.log('CLEARED Cache');
}
setInterval(getMemory,1000*60*10);

let is_lookting = false;

function lookt()
{
  if(!is_lookting)
    log("now lookting");
  is_lookting = true;
  
	var looted=0;
	if(safeties && mssince(last_loot)<min(300,character.ping*3)) return;
  last_loot=new Date();

  if(booster_shift() && booster_shift() != "goldbooster")
  {
    log("waiting for booster");
    return;
  }
  if((item_location2("handofmidas")>= 0 && (!character.slots.gloves || character.slots.gloves.name != "handofmidas")))
  {
    log("waiting for midas");
    return;
  }

	for(var id in parent.chests)
	{
		var chest=parent.chests[id];
		if(safeties && (chest.items>character.esize || chest.last_loot && mssince(chest.last_loot)<1600)) continue;
		chest.last_loot=last_loot;
    parent.open_chest(id);
		// parent.socket.emit("open_chest",{id:id}); old version [02/07/18]
		looted++;
		if(looted==2) break;
  }

  if(Object.keys(parent.chests).length <= 0)
  {
    is_lookting = false;
    log("now not lookting")
  }
    
}

add_top_button("guide","Guide",x=>parent.show_game_guide());

function uncruise()
{
  parent.socket.emit("cruise");
}

window.is_cruising = false;
window.cruise_speed = -1;

function bday_party()
{
  let iD = [];
function d(name){
    let boo = true;
    for(let i in iD){
        if(name===iD[i]){
            boo=false;
            break;
        };
    };
    if(boo) iD.push(name);
    return boo;
};
setInterval(function(){iD=[];},4000);
function p(){
    let player = null;
    for(let id in parent.entities){
        let current = parent.entities[id];
        if(current.type!=="character") continue;
        if(d(current.id)){
            player=current;
            break;
        };
    };
    return player;
};
setInterval(function(){send_gold(p().name,1)},200)
}

function re_party()
{
  const current_server = parent.server_region+parent.server_identifier
  for(let char of parent.X.characters)
  {
    if(char.server && char.server == current_server && char.name != character.name)
    {
      if(["CodeGra","CodeSlut"].includes(character.name) && ["CodeGra","CodeSlut"].includes(char.name)) continue;
      log("Sending invites to " + char.name);
      send_party_request(char.name);
      send_party_invite(char.name);
      return true;
    }
  }
  return false;
}

var cached_local_target = null;
window.elixir_key = new aland_storage.Char_key("_elixir");
var pseudo_tick_clock = 0;
var main_loop_per_second = 12;
setInterval(function() {
  if(!parent.character) return;
  
  pseudo_tick_clock = pseudo_tick_clock + 1;
  if(pseudo_tick_clock % (main_loop_per_second * 60) == 0)
    log("A new minute starts");

  if (character.rip) {
    if(pseudo_tick_clock % (main_loop_per_second * 2) == 0)
    {
      respawn();
      aland_loggi.log("Being dead rn");
    } 
    
    return;
  }
  let scory = 0;
  for(let _mid in parent.entities)
  {
    const _ment = parent.entities[_mid];
    if(_ment.type=="monster" && _ment.target==character.name)
      scory++;
  }

  if(scory && !get_entity("CodeSlut") && character.hp < character.max_hp * 0.3) relog();

  if(pseudo_tick_clock % (main_loop_per_second * 60 * 30) == 0)
  {
    aland_loggi.log("LV: " + character.level + " XP: " + (character.xp / character.max_xp));
    aland_loggi.log("GOLD: " + gold_this_hour);
    aland_loggi.log("KILLS: " + JSON.stringify(deaths_tracker));
    gold_this_hour = 0;
    deaths_tracker = {};
    //now we see whether or not we break even
  }
    

  
  custom_pot_script();
  item_loop_logic();

  //stand logic
  if (is_moving(character) && character.stand) {
    parent.close_merchant();

  } else if (!is_moving(character) && !character.stand && character.ctype =="merchant" && item_location2("stand0") >= 0) {
      parent.open_merchant(item_location2("stand0"));
  }



  if(pseudo_tick_clock % (main_loop_per_second * 10) == 0)
  {

    if(parent.get_npc("secondhands") && distance(character,parent.get_npc("secondhands")) <= 400)
      parent.socket.emit("secondhands");
    
    if(parent.entities["CodeSlut"] && character.ctype!="merchant" && item_location2("computer") < 0)
      dump_into_anna("CodeSlut");

      //check for party people without rspeed buff
      /*
    if(character.name == "CodeSlut")
      for(let my_stuff of parent.X.characters)
      {
        const inst_stuff = parent.entities[my_stuff.name];
        if(inst_stuff && inst_stuff.ctype != "merchant"&& inst_stuff.visible && distance(inst_stuff,character) <= G.skills.rspeed.range && (!inst_stuff.s.rspeed || inst_stuff.s.rspeed.ms <= 30 * 1000))
        {
          aland_loggi.log("Requiring rspeed on " + my_stuff.name);
          switch_char("CodeGra");
        }
      }*/

    if(character.name == "CodeGra" && pseudo_tick_clock % (main_loop_per_second * 20))
    {
      if(parent.entities.CodeGorm && distance(parent.entities.CodeGorm,character) <= 300)
        switch_char("CodeSlut");
    }

    if(elixir_key.get() && G.items[elixir_key.get()].type=="elixir" && (!character.slots.elixir
    || character.slots.elixir.name != elixir_key.get()) && item_location(elixir_key.get()) != null)
    {
      use(item_location(elixir_key.get()));
    }

    find_sells();

    track_item_quants();
    adjust_url();
    if(character.ctype != "merchant")
      {correct_server();}

//TODO this works worse than it used to
    const sorv_components = realm_components(realm_key.get());
    if(!get_party()[character.name])
    {
      log("Attempting to party")
      re_party();
      if(character.ctype != "merchant")
        use("town");
      
    }
    //TODO hop can be optional
    //maybe call this only once
    //TODO hop into next server instead of merchant realm
    else if(character.ctype == "merchant" 
      && (parent.server_region == sorv_components[1] || parent.server_identifier != sorv_components[2]))
    {
      //const _nraf = parent.entities[obliteration_key.get()] || get_party()[obliteration_key.get()]
      //refill_party();
      refill_party()
      if(character.map == "level1") move(105,226);
      Sleep(7000)
        .then(x=>hop_next_realm());
    }

  }
  
    const my_mfer = "CodeGorm";
  //if near mfer or being mfer self
  if((character.ctype == "merchant" && character.map=="cyberland") || is_lookting || ((pseudo_tick_clock%(main_loop_per_second * 10)<= 0) && (!parent.entities[my_mfer] || !get_party()[my_mfer])))
  {
    //log("calling lookt");
    lookt();
  }
    
  if(character.ctype == "merchant" && pseudo_tick_clock % (main_loop_per_second * 60 * 60) == 0)
  {
    if(false)
      party_quest();
    else
      important_business = reflask_run()
        .then(x=>log("Party restock complete"));
        //the then will never be hit due to a server hop occuring
        //recursive compound always terminates with error
        
    log(character.name + " is restocking party");
  }

  if(character.ctype == "rogue")
  {
    if(!character.s.invis && skill_applicable(character,"invis"))
      use_skill("invis", character);
    //attempt spam rspeed
    for(name in parent.entities)
    {
      const member_ent = parent.entities[name];
      if(!member_ent || member_ent.type != "character" || member_ent.npc || ["MageAuricle", "RogAur", "PriestAur"].includes(member_ent.name)) continue;
      if(!get_party()[name] && !trusted_partners.includes(name) && !(parent.X.characters.some(char =>{return char.name == name;}))) continue;
      const bonus_skill = "rspeed";
      if (member_ent && skill_applicable(member_ent,bonus_skill)
        && (!member_ent.s[bonus_skill] || 
          (member_ent.s[bonus_skill].ms < 42 * 60 * 1000)))
        {
          use_skill(bonus_skill, member_ent);
          parent.skill_timeout(bonus_skill,100);
          if(Math.random() < 0.1)
            log("Using rspeed on " + member_ent.id);
          //member_ent.s["mluck"] = {ms:60*60*1000,f:character.name}
        }
    }
  }

  if(character.ctype == "merchant")
  {
    //attempt spam mluck
    for(name in parent.entities)
    {
      const member_ent = parent.entities[name];
      if(!member_ent || member_ent.type != "character" || member_ent.npc || ["MageAuricle", "RogAur", "PriestAur"].includes(member_ent.name)) continue;
      const bonus_skill = "mluck";
      
      if (member_ent && skill_applicable(member_ent,bonus_skill)
        && (!member_ent.s.mluck || 
          (!member_ent.s.mluck.strong || member_ent.s.mluck.f == character.name) && (member_ent.s.mluck.ms < 56 * 60 * 1000 || member_ent.s.mluck.f != character.name)))
        {
          use_skill(bonus_skill, member_ent);
          parent.skill_timeout("mluck",100);
          if(Math.random() < 0.1)
            log("Using mluck on " + member_ent.id);
          //member_ent.s["mluck"] = {ms:60*60*1000,f:character.name}
        }
    }
    change_target();
        return;
  }
  if(!(character.name in get_party()))
  {
    return;
  }

  //Check for modifications in storage and react accordingly
  if (obliteration_key.get() != local_obliteration_value)
  {
    obliterate(obliteration_key.get());
  }

  if(character.name == "CodeGra" && obliteration_key.get() != obliteration_key.get("CodeSlut"))
    obliterate(obliteration_key.get("CodeSlut"));
  var old_target = get_targeted_monster();
  var target = pick_next_target();
  
  if(is_best_target(target) || !is_lookting)
  {
    if(!character.slots.gloves || character.slots.gloves.name == "handofmidas")
    {
      let g_locs = [];
      for(var i = 0; i < 42; i++)
      {
        var current_item = character.items[i]
        if(!current_item) continue;
        if((["gloves"].includes(G.items[current_item.name].type) && current_item.level > 5))
          g_locs.push(i);
      }
      if(g_locs.length >= 1)
      {
        log("gloves on " + g_locs[0]);
        unequip("gloves");
        equip(g_locs[0]);
        return;
      }
    }
  }
  else if(item_location2("handofmidas")>=0 && (!character.slots.gloves || character.slots.gloves.name != "handofmidas"))
  {
    log("equipping midas on " + item_location2("handofmidas"))
    unequip("gloves");//TODO add some actual grace periods
    equip(item_location2("handofmidas"));
  }
    

  if(is_best_target(target))
    {booster_shift("luck");}
  else if(is_lookting)
    {
      booster_shift("gold");
    }
  else
    {booster_shift("xp");}

  if(character.ctype == "warrior")
  {
    if((!target || !skill_applicable(target,"stomp") || target.s.stunned || character.s.hardshell))
    {
      if((!character.slots.mainhand||G.items[character.slots.mainhand.name].wtype == "basher"))
      {
        let sword_locs = [];
        for(var i = 0; i < 42; i++)
        {
          var current_item = character.items[i]
          if(!current_item) continue;
          if((character.ctype == "warrior" && ["short_sword","sword"].includes(G.items[current_item.name].wtype) && current_item.level > 5))
            sword_locs.push(i);
        }
        if(sword_locs.length >= 2)
        {
          //log("doing blades");
          //unequip("mainhand");
          //equip(sword_locs[0],"mainhand");
          //equip(sword_locs[1],"offhand");
          //return;
        }
      }
    }
    else if(G.items[character.slots.mainhand.name].wtype != "basher")
    {
      let ioi = item_location2("wbasher");
      if(ioi >= 0 && character.items.filter(x=>x==null).length > 0)
      {
        //log("doing basher");
        //unequip("offhand");
        //unequip("mainhand");
        //equip(ioi,"mainhand");
        //return;
      }
      
    }
      //switch to basher
  } 
  if(get_party()[local_obliteration_value])
  {//this largely works, but problem is how do i know here is when use transport
    const p_ent = parent.entities[local_obliteration_value];
    const next_safe = (p_ent && p_ent.visible && p_ent) ||  get_party()[local_obliteration_value];
    safety = {map:next_safe.map,x:next_safe.x,y:next_safe.y};
  }
  else if(local_obliteration_value == "_snek" && (pseudo_tick_clock % (main_loop_per_second * 4) == 0))
  {
    if(pseudo_tick_clock % (main_loop_per_second * 8) == 0)
    {
      safety = {x:-569,y:-575,map:"halloween"};
      log("Going up");
      say("up");
    }
    
    else 
    {
      safety = {x:-569,y:-470,map:"halloween"};
      log("Going down");
      say("up");
    }
  }
  else if(local_obliteration_value == "cgoo" && (pseudo_tick_clock % (main_loop_per_second * 15) == 0))
  {
    if(pseudo_tick_clock % (main_loop_per_second * 30) == 0)
    {
      safety = {
        "x": -100,
        "y": -400,
        "map": "arena"
      };
      log("Going left");
    }
    
    else 
    {
      safety = {
        "x": 800,
        "y": -400,
        "map": "arena"
      };
      log("Going right");
    }
    
  }


  if(!target && !smart.moving && !safety && local_obliteration_value)
  {//some things do not correctly compute a safety
    smart_comment = -5;
    smart_move(local_obliteration_value);
  }

  if(character.ctype == "mage" && character.map == "spookytown" && pseudo_tick_clock % (main_loop_per_second * 60 * 13) == 0)
  {
    aland_loggi.log("Checking Jr");
    log("Checking Jr");
    smart_comment = -3;
    smart_move("jr")//respawn long time
    .then(x=>Sleep(1000))
    .then(x=>{
      if(!is_best_target(get_targeted_monster()))
      {
        aland_loggi.log("Checking Green Jr");
        log("Checking Green Jr");
        smart_comment=-3;
        return smart_move("jr")
        .then(x=>Sleep(1000))
        .then(x=>{
          if(!is_best_target(get_targeted_monster()))
          {
            aland_loggi.log("Checking Ms Dracul");
            log("Checking Ms Dracul");
            smart_comment=-3;
            return smart_move("fvampire")//respawn every 24 min on avg
          }
          //if we not yet have best target look for mrgreen
        });
      }
      //if we not yet have best target look for mrgreen
    });
    
    /*if(skill_applicable(character,"blink") && character.mp >= (900 + 1600))
    {
      
      const smort = smart;
          blink_push = null;
          const loc = find_random_pack("jr");
          use_skill("blink",[(loc[1]+loc[4])/2,(loc[2]+loc[5])/2]);//use blink
      //if i rly code this i also need to code magiport
    }*/
  }

  if((character.s.monsterhunt && character.s.monsterhunt.c == 0) && local_obliteration_value != "monsterhunter")
    obliterate("monsterhunter");
  
  perform_combat(target);
  //set cruise speed
  //if a monster exists and is between 0.9 and 1 times character range away
  
  if(target && distance(target,character) >= 0.85 * character.range && distance(target,character) <= 0.95 * character.range)
  {
    const trg_speed = target.s && target.s.stunned && 1 || target.speed;
    if(cruise_speed != trg_speed)
    {
      cruise_speed = trg_speed;
      cruise(trg_speed);
    }
  }
  else if(cruise_speed >= 0)
  {
    cruise_speed = -1;
    uncruise();
  }
  



  if(!character.moving || smart.moving)
  {
    simple_move(target);
  }
    

  if(local_obliteration_value == "fancypots" && distance(find_npc("fancypots"),character) < 60)
  {
    //TODO this is very much a hack
    dump_into_anna("CodeAnna");
    buy_potions();
    obliterate(cached_local_target);
  }

  if((!character.s.monsterhunt || character.s.monsterhunt.c <= 0) && (check_is_hardcore() || distance(find_npc("monsterhunter"),character) < 60))
    hunter_quest();
  
  if(local_obliteration_value == "monsterhunter" && (distance(find_npc("monsterhunter"),character) < 30))
  {
    obliterate("fancypots");
  }
  
}, 1000 / main_loop_per_second);

function on_party_invite(name)
{
  if(parent.X.characters.some(char =>{return char.name == name;}))
    accept_party_invite(name);
  aland_loggi.log(character.id + " got party invite from " + name);
}

window.trusted_partners = ["WizzyBoi",
	"RangeyBoi",
  "Wazza",
  "MageS",
  "SorcS",
  "MagicS",
  "Annihilation"];//TODO remove, he only need few levels


function on_party_request(name)
{
  if(parent.X.characters.some(char =>{return char.name == name;}))
    accept_party_request(name);
  if(trusted_partners.includes(name))
    accept_party_request(name);
  aland_loggi.log(character.id + " got party request from " + name);
}

character.on("death",function(data){
  aland_loggi.log(character.id + " just died!");
  //show_json(data);
  /*
  if(parent.next_skill.use_town>new Date())
  {
    aland_loggi.log(character.id + " was murdered brutally");
    
    
    if(game.cli)
      cli_disable();
    else
      change_server("EU","I");
  }*/
});
window.deaths_tracker = {};
game.on("death",data=>{
  
  const mtype = parent.entities[data.id] && parent.entities[data.id].mtype
  if(!deaths_tracker[mtype]) deaths_tracker[mtype] = 0;
  deaths_tracker[mtype]++;
})

let gold_this_hour=0;
character.on("loot",function(data){
  if(data.opener == character.name)
  {
    gold_this_hour += data.gold;
  }
});

let next_anna = new Date();
character.on("item_received",data=>{
  if(data.from=="CodeAnna" && next_anna <= new Date())
  {
    next_anna = new Date(Date.now() + 5000);
    if(tracked_quants[data.name])
      dump_into_anna("CodeAnna");
  }
    
})

function on_disappear(entity,data)
{
  if(data && data.reason == "transport" && get_party()[data.id] && G.maps[data.to].spawns[data.s])
  {
    game_log("transport override: " + JSON.stringify(data));
    const delt = {map:data.to,
      in:data.to,
      x:G.maps[data.to].spawns[data.s][0],
      y:G.maps[data.to].spawns[data.s][1]};
    Object.assign(get_party()[data.id],delt);
    //show_json(delt);
    //show_json(get_party()[data.id]);
  }
  if(entity == parent.character && data&& data.effect=="blink" && blink_push)
  {
    smart.plot = blink_push;
  }
	 
}
//https://glitch.com/edit/#!/succulent-cord-chive?path=main.js%3A43%3A41
parent.socket.on("limitdcreport", function(a) {
  a.mcalls["!"] = "You've made " + a.climit + " callcosts in 4 seconds. That's tooooo much. This is most probably because you are calling a function like 'move' consecutively. Some calls are also more expensive than others. If you are experiencing issues please email hello@adventure.land or ask for help in Discord/#code_beginner. Ps. You made " +
      to_pretty_num(a.total) + " calls in total." + new Date();
  
  set(character.name + "_tma",a);
});

parent.socket.on("achievement_progress", function(a) {
  if(a.count < 10) return;
  say("AP[" + a.name + "]: " + a.count + "/" + a.needed);
  if((a.count % 100) == 0)
    aland_loggi.log("AP[" + a.name + "]: " + a.count + "/" + a.needed);
});


aland_loggi.log("Booted up char " + character.name + " in "+parent.server_region+parent.server_identifier);
aland_loggi.log("Current Gold: " + character.gold);

function on_combined_damage() {
  let x = -10 + Math.round(20 * Math.random())
  let y = -10 + Math.round(20 * Math.random())
  move(parent.character.x + x, parent.character.y + y)
}

//these functions are here for event reference

var char_event_researcher = {};
character.all(function(name,data){
	char_event_researcher[name] = data;
});
var game_event_researcher = {};
game.all(function(name,data){
	game_event_researcher[name] = data;
});

character.on("hit",x=>{
  if(parent.entities[x.actor] && parent.entities[x.actor].player && (!get_party()[x.actor]&&!(parent.X.characters.some(char =>{return char.name == x.actor;}))))
  {
    aland_loggi.log("Agressions from " + x.actor);
    into_prison();
    obliteration_key.set_all("jrat");
    if(character.name != "CodeHorst" && get_party().CodeHorst)
      obliterate("CodeHorst");
  }
});

function debug_the_bug()
{
  //works for supershot but not for use_town
  var skil_name = "use_town";
  parent.skill_timeout(skil_name,2222);
  show_json(parent.next_skill[skil_name]-new Date());
}

character.on("stacked",function(){ move(character.real_x + (Math.random()*50)-25, character.real_y + (Math.random()*50)-25); });

character.on("cm",event=>{
  if(trusted_partners.includes(event.name) && event.message == "phoenix?")
  {
    send_cm(event.name,{
      char_name:character.name,
      x:character.x,
      y:character.y,
      phoenix:(Object.values(parent.entities).some(x=>x.mtype=="phoenix"))
    });
  }
});

//ROADMAP
//fix unecessary movement calls
//fix movement alltogether for CLI