function hc_guide()
{//parent.show_game_guide()
  //parent.electron_dev_tools()
  parent.show_modal(parent.$('#hardcoreguide').html());
}

/*
//This code monitors say messages in comm panel
if(!window.d_toxt)
  window.d_toxt = window.d_text;
window.d_buff=[];
window.d_text=function(a,b,c,d)
{
	if(a.startsWith("AP"))
		d_buff.push(b.name+":"+a);
	d_toxt(a,b,c,d);
}

*/

function is_weak(entity)
{
  return entity.hp <= (character.attack * 1.24);
}

function blink(thing)
{
  return use_skill("blink",[thing.x,thing.y]);
}

function _devtools()
{
  parent.electron_dev_tools();
}

function check_is_hardcore()
{
  return "hardcore" == parent.gameplay;
}

function priest_heal_val()
{
  let att_val = character.attack;
  if(check_is_hardcore() && character.ctype == "priest")
    att_val *= .6;
  return att_val;
}

function target_is_aggro()
{
  var mob = get_targeted_monster();
  return mob && mob.target in get_party();
}

function warrior_best()
{

}

function cached_or_generate(key,generator)
{
  return function()
  {
    if(this[key] == null)
      return this[key] = generator.call(this);
    return this[key];
  }
}

function _compare_monsters(monster, party_targets)
{
  this.monster = monster;
  this.party_targets = party_targets;
}
//TODO check if party is assembled(close to each other)
//TODO make the warrior prioritize boss mobs
window.glob_scare_count = 0;
window.glob_party_scare = 0;

_compare_monsters.prototype = {
  //maybe also code is_phoenix
  constructor: _compare_monsters,
  is_targeting_party: cached_or_generate("_is_targeting_party",function()
    {return (this.monster.target in get_party()) && !(this.monster.id in get_party());}),
  warriors_honor: cached_or_generate("_warriors_honor",function() {
      if(!((character.s.hardshell && character.s.hardshell.ms >= 2000) || this.monster.hp <= character.attack * 2 || glob_scare_count >= 2)) return false;
      if(is_on_cooldown("taunt")) return false;
      if(character.ctype == "warrior" && this.is_targeting_party() && this.monster.target != character.id)
      {
        var defendant = parent.entities[this.monster.target];
        return (defendant.id != "CodeGorm" &&  (character.max_hp - character.hp) < (1.1 * defendant.max_hp - defendant.hp))
          || (defendant.hp <= (0.3 * defendant.max_hp));
      }
      return false;}),
  warriors_pull: cached_or_generate("_warriors_pull",function() {
    if(true)
      return false;
    if(character.ctype == "warrior" && glob_scare_count < 2 && glob_party_scare < 3)
      {
        return this.monster.target;
      }
      return false;}),
  ranger_fear: cached_or_generate("_ranger_fear",function() {
    //FIXME check for helping party
    if(true)
      return false;
    return (character.ctype == "ranger" && (this.monster.hp <= 7000 || this.burning_dead())
      && character.slots.mainhand && character.slots.mainhand.name=="firebow"
      && character.slots.mainhand.p!="firehazard");}),
  party_is_targeting: cached_or_generate("_party_is_targeting",function()
    {return  (this.party_targets[this.monster.id]) && !(this.monster.id in get_party());}),
  is_phoenix: cached_or_generate("_is_phoenix",function()
  {return is_best_target(this.monster);}),
  correct_type: cached_or_generate("_correct_type",function()
    {return is_good_target(this.monster);}),
  burning_dead: cached_or_generate("_burning_dead",function()
  {
    const burn = this.monster.s.burned;
    if(!burn) return false;
    return this.monster.hp <= (Math.floor(burn.ms / G.conditions.burned.interval)*burn.intensity) / 5;
  }),
  dist: cached_or_generate("_distance",function()
    { var  reference = get_entity("CodeGorm") || get_entity("CodeSlut") || character;
      return distance(reference,this.monster);}),
    //TODO maybe this should depend on character range
    //maybe not
  short_distance: cached_or_generate("_short_distance",function()
    {return this.dist() <= Math.max(150,character.range);}),
  compare: function(other){
    if(other == null)
    {//this is all fucked beyond compare
      return !this.ranger_fear() && (this.is_targeting_party() || this.party_is_targeting() || (party_healthy() && this.correct_type()));
    }
    function c(a,b)
    {return (!a==!b)?0:a?1:-1;}
    return c(!this.burning_dead(),!other.burning_dead())  
      || c(!this.ranger_fear(),!other.ranger_fear())  
      || c(this.is_targeting_party(),other.is_targeting_party()) 
      || c(this.warriors_honor(),other.warriors_honor())
      || c(this.party_is_targeting(),other.party_is_targeting())
      || ((this.is_targeting_party() || this.party_is_targeting()) ?
        (other.monster.hp - this.monster.hp) : 0)
        //is phoenix hack here
      || c(this.is_phoenix(),other.is_phoenix())
      || c(this.correct_type(),other.correct_type())
      || c(this.warriors_pull(),other.warriors_pull())
      || c(this.short_distance(),other.short_distance())
      || (this.short_distance() ? 
        this.monster.level - other.monster.level : 0)
      || other.dist() - this.dist();
  }
}

window.more_att_targets = [];
//TODO potentially avoid very strong monsters
function pick_next_target()
{
  glob_scare_count = 0;
  glob_party_scare = 0;
  for(let _mid in parent.entities)
  {
    const _ment = parent.entities[_mid];
    if(_ment.type=="monster" && _ment.target==character.name)
      glob_scare_count++;
    if(_ment.type=="monster" && get_party()[_ment.target])
      glob_party_scare++;
  }


  var party_targeting = {};
  for(name in get_party())
  {
    var member = parent.entities[name];
    if(member && member.target)
      party_targeting[member.target] = member.id;
  }
  var best_target = null; 
  let more_att_targets = [null];
  
  for (id in parent.entities) {
    var current = parent.entities[id];
    if((current.type!="monster" && current.type!="character") || !current.visible || current.dead) continue;
    
    var current_data = new _compare_monsters(current,party_targeting);
    if(current_data.compare(more_att_targets[0]) > 0)
    {
      let loldom = Math.random();
      let v = 1;
      for(; v < more_att_targets.length;v++)
      {
        if(current_data.compare(more_att_targets[v]) <= 0) break;
      }
      more_att_targets.splice(v,0,current_data);
      more_att_targets = more_att_targets.slice(-5);
    }
    //compare all monsters
    if(current_data.compare(best_target) > 0)
    {
      best_target = current_data;
    }
  }
  window.more_att_targets = more_att_targets;
  //best_target = more_att_targets[more_att_targets.length - 1];
  var victim = get_targeted_monster();
  var candidate = null;
  if(best_target)
  {
    /*if(Math.random() < 0.05)
    {
      log("hulo " + best_target.party_is_targeting() + best_target.is_targeting_party() + best_target.monster.id);
      log("holo " + (best_target.monster.target in get_party()) + " " + (best_target.monster.id in get_party()));
    }*/
      
    candidate = best_target.monster;
    if(!best_target.party_is_targeting())
      change_target(candidate, true);
    else if(!victim || victim.id != candidate.id)
      change_target(candidate);
  }
  else if(victim)
    change_target(candidate,true);
  return candidate;
}

function check_range_of_skill(target,skill)
{
  const skill_def = G.skills[skill];
  if(skill_def && skill_def.range)
  {
    return distance(character,target)<=skill_def.range;
  }
  return is_in_range(target,skill);
}

var blink_push = null;

//character.slots.mainhand
function skill_applicable(target,skill)
{
  var glob = G.skills[skill];
  if(!glob) log(skill);
  return (character.level >= (glob.level || 0)) && character.mp >= (glob.mp || 0)
    && !is_on_cooldown(skill) && check_range_of_skill(target, skill);
}

function perform_combat(target)
{
  if(character.ctype == "rogue") return;
  var heal_target = null;
  var party_miss_health = 0;
  if(character.ctype == "priest")
  {
    for(name in get_party())
    {
      var ally = parent.entities[name];
      if(name == character.name) ally = character;
      if(!ally)
        continue;
      party_miss_health += (ally.max_hp - ally.hp );
      if(!ally || !((ally.max_hp - ally.hp ) >= priest_heal_val() * 0.65 || (target==null&&!party_healthy() && character.mp >= character.max_mp*0.65+character.mp_cost) )
        || !can_heal(ally,"heal")) continue;
      
      if(!heal_target || ally.max_hp - ally.hp > heal_target.max_hp - heal_target.hp) heal_target = ally;
    } 

  }

  let proast = false;
  for(member in get_party())
  {
    if(get_party()[member].type == "priest")
      proast = parent.entities[member];
  }
  
  if(heal_target && skill_applicable(heal_target,"heal") && character.mp > character.mp_cost)
  {
    heal(heal_target);
    log("heal");
  }
  else if((party_miss_health >= priest_heal_val() * 0.8 || (target==null&&!party_healthy() && character.mp >= character.max_mp*0.65+G.skills.partyheal.mp)) && skill_applicable(character,"partyheal"))
  {
    use_skill("partyheal",character);
  }
  else if((character.hp <= character.max_hp * 0.3) && character.slots.orb && character.slots.orb.name == "jacko" && skill_applicable(character,"scare")) 
  {
    use_skill("scare",character);
  }
  //spam light in pvp environments
  else if(is_pvp() && character.ctype == "mage" && skill_applicable(character,"light") 
    && character.max_mp * 0.3 + G.skills.light.mp <= character.mp)
  {
    use_skill("light",character);
    parent.skill_timeout_singular("light",12000);
  }
  else if(target)
  {//if target is best try and assemble party
    //if no target and far away from safety blink there
    if(target.mtype && target.mtype.includes("fairy"))
    {
      if (!character.s.hardshell && skill_applicable(target,"stomp") && !target.s.stunned
        && character.slots.mainhand && G.items[character.slots.mainhand.name].wtype == "basher")
        {
          use_skill("stomp");
          if(target.mtype && target.mtype.includes("fairy") && character.slots.orb && character.slots.orb.name=="jacko")
          {
            use_skill("taunt",target);
            setTimeout(x=>use_skill("scare"), 3.15*1000);
          }
          
        }
          
      if(!(target.target && target.s.stunned && (character.ctype == "warrior" && target.s.stunned.ms >= 450 || target.s.stunned.ms >= 1200)))
        return;
        
    }
      
    if((party_healthy()) || target_is_aggro())
    {//Just fire everything
      set_message("Fighting");
      if (character.mp > character.mp_cost && can_attack(target) && !is_on_cooldown("3shot")) {
        //2020-06-02 There exists a bug where attacks go out of sync with this buff
        if(character.ctype != "ranger" || !skill_applicable(target,"3shot") || (character.mp < character.max_mp * 0.1 + G.skills["3shot"].mp)
          || (!get_targeted_monster() ||more_att_targets.some(x=>x && x.monster.level > 1) || !proast
          || more_att_targets.some(x=>x && is_best_target(x.monster))
          || !is_good_target(get_targeted_monster()) || is_best_target(get_targeted_monster())))
        {
          attack(target);
        }
        else
        {//maybe only 3shot if we have 3 targets
          //if enemys have less than attack hp we can afford getting scraed
          //else we prolly shouldnt
          //make sure that we dont get scared
          //count how many things are targeting us
          //save it in a number
          //line up a 3shot of 3,2,1
          //check how many die.
          //if not enough die 3shot less monsters
          let am_targeted = glob_scare_count;
          let s_trg = 3;
          for(; s_trg > 2; s_trg--)
          {
            let _cur_red = am_targeted;
            
            let _cur_cands = more_att_targets.slice(-s_trg);
            if(!_cur_cands[0])
              _cur_cands = _cur_cands.slice(1);
            for(let blimey of _cur_cands)
            {
              blimey = blimey.monster;
              if(blimey.target==character.name && blimey.hp<=character.attack * 0.7/* * 0.9*/)
              {
                _cur_red--;
              }
              else if(!blimey.target&& blimey.hp > character.attack * 0.7/* * 0.9*/)
              {
                _cur_red++;
              }

            }
            let scary_max = 3;
            if(_cur_cands.every(x=>x.monster.hp <= character.attack * 1.008) && (character.mp >= character.max_mp * 0.1 + G.skills["3shot"].mp * 2))
              {scary_max=4;}
            if(_cur_red < scary_max)
              break;
          }
          let _cur_cands = more_att_targets.slice(-s_trg);
          if(!_cur_cands[0])
              _cur_cands = _cur_cands.slice(1);
          _cur_cands  = _cur_cands.filter(x=>is_in_range(x.monster));
          if(_cur_cands.length > 2)
          {
            use_skill("3shot", _cur_cands.map(x=>x.monster.id));
            log("3shot");
          }
            
          else
            {attack(target);}
        }
      }
      else if(character.ctype == "mage")
      {
        var mana_candidate = null;
        for(name in get_party())
        {
          var ally = parent.entities[name];
          if(!ally || ally.mp >= ally.max_mp || !check_range_of_skill(ally,"energize") || character.mp < 1) continue;
          
          if(!mana_candidate || ally.max_mp*.9 - ally.mp > mana_candidate.max_mp*.9 - mana_candidate.mp) mana_candidate = ally;
        } 
        if(mana_candidate && skill_applicable(mana_candidate,"energize"))
        {
          const mana_amount = Math.max(1,Math.min(mana_candidate.max_mp*0.9 - mana_candidate.mp,character.mp - character.max_mp * 0.3));
          use_skill("energize",mana_candidate,mana_amount);
          log("energizing (" + mana_amount +") " + mana_candidate.name);
        }
        else if(target.target == "CodeGorm" && target.damage_type == "magical" && parent.entities["CodeGorm"] && skill_applicable(parent.entities["CodeGorm"],"reflection"))
        {
          use_skill("reflection",parent.entities["CodeGorm"]);
        }
        else 
        {//if we are not scouting or target best or target.player then skip
          if(smart_comment !== -3 || is_best_target(target) || target.player)
          {
            if(taxi_dist(target) <= 500)
            for(let wumbo of Object.entries(get_party()).sort((a,b)=>(1+b[1].type=="priest")-(a[1].type=="priest")))
            {
              let member_n =wumbo[0];
              if(member_n == character.name) continue;
              const member = parent.entities[member_n] || get_party()[member_n];
              if(skill_applicable(character,"magiport") && taxi_dist(member) >= 500)
              {
                //log("can port " + member_n)
                if((obliteration_key.get(member_n) == local_obliteration_value || obliteration_key.get(member_n) == character.name))
                  {use_skill("magiport",member_n);}
              }
              
            }
          //if we have party members who are far away 
          }
        }
        //burst is actually bad
        /*else if((character.max_mp - character.mp < 300) && skill_applicable(target,"burst"))
          use_skill("burst",target);*/
      }
      else if(character.ctype == "ranger")
      {
        let alt_best_target = null;
        for(let i = more_att_targets.length - 1; i >= 0; i--)
        {
          if(more_att_targets[i] && is_best_target(more_att_targets[i].monster))
          {
            alt_best_target = more_att_targets[i].monster;
            break;
          }
        }

        if((character.mp < character.max_mp * 0.1 + G.skills["huntersmark"].mp) && skill_applicable(target,"huntersmark") && !is_weak(target) && target.hp >= 10 * character.attack)
          use_skill("huntersmark",target);
        else if(skill_applicable(target,"supershot") && (is_best_target(target) && distance(character,target)>=character.range * 1.35))
          use_skill("supershot",target);
        else if(skill_applicable(alt_best_target,"supershot") && (distance(character,alt_best_target)>=character.range * 1.35))
          use_skill("supershot",alt_best_target);
      }
      else if(character.ctype == "warrior")
      {
        //check for alternative targets to dump an off cooldown attack into
        let am_targeted = glob_scare_count;
        let __alt_trg = null;
        let rufno = more_att_targets.slice(-3);
        for(let iota = rufno.length-1; iota >= 0; iota--)
        {
          const more_mobs = rufno[iota];
          if(!is_best_target(target) && more_mobs && check_range_of_skill(more_mobs.monster) && (more_mobs.monster.target || am_targeted < 2) && !more_mobs.burning_dead() )
          {
            __alt_trg = more_mobs.monster;
            break;
          }
        }
        if (__alt_trg && character.mp > character.mp_cost && can_attack(__alt_trg) && !__alt_trg.mtype.includes("fairy")) 
          {//warriors might be going for a target that is far away even tho attack is off cd
            log("secondary attack");
            attack(__alt_trg);}//TODO check stats if circling actually helps
        else if( !(target.mtype && target.mtype.includes("fairy")) && skill_applicable(target,"taunt") && (target.target in get_party()) && target.target != character.id && (target.mtype != "oneeye" || get_party()[target.target].type != "merchant") ((character.s.hardshell && character.s.hardshell.ms >= 2000) || target.hp <= character.attack * 2 || am_targeted < 2 &&( !parent.entities[target.target] || distance(parent.entities[target.target],target) <= target.range * 1.1 || circle_movement)))
          use_skill("taunt",target);
        else if(!character.s.hardshell && skill_applicable(target,"stomp") && !target.s.stunned && (target.target != null) 
          && character.slots.mainhand && G.items[character.slots.mainhand.name].wtype == "basher")
          {
            use_skill("stomp",target);
            if(target.mtype && target.mtype.includes("fairy") && character.slots.orb && character.slots.orb.name=="jacko")
            {
              use_skill("taunt",target);
              setTimeout(x=>use_skill("scare"), 3.15*1000);
            }
          }
          
        else if(skill_applicable(character,"warcry"))
          use_skill("warcry",character);
        else if(!target.s.stunned && skill_applicable(character,"hardshell") && target.target == character.id && target.damage_type == "physical" && target.hp >= 4 * character.attack && check_range_of_skill(target))
          use_skill("hardshell",character);
        else if(skill_applicable(character,"charge") && distance(character,target)>=70 && (can_move_to(target.real_x,target.real_y)||smart.found&&smart.moving ))
          use_skill("charge",character);

        
      }
      else if(character.ctype == "priest")
      {
        //check if warrior is in party and nearby
        let dbless = false;
        for(member in get_party())
        {
          if(get_party()[member].type == "warrior")
            dbless = parent.entities[member];
        }
        if(target.target in get_party() && parent.entities[target.target] && 
          (parent.entities[target.target].hp / parent.entities[target.target].max_hp) <= 0.3  && 
          skill_applicable(parent.entities[target.target],"absorb"))
          use_skill("absorb",parent.entities[target.target]);

        else if(skill_applicable(target,"curse") && target.hp >= 5.0 * character.attack)
          use_skill("curse",target);
        else if(skill_applicable(character,"darkblessing") && (!dbless || character.s.warcry))
          use_skill("darkblessing",character);
      }
    }
    else
    {set_message("Healing up");}
  }
  else
  {
    if(character.ctype == "mage" && skill_applicable(character,"blink") && character.mp >= 1800 + 1600)
    {
      const smort = smart;
      if(safety && safety.map == character.map && taxi_dist(safety) >= 500)
        {
          blink_push = null;
          use_skill("blink",[safety.x,safety.y]);}//use blink
      else if(smort.moving && smort.found)
      {
        const debog = smort.plot.length;
        for(let i = debog - 1; i >= 0; i--)
        {
          if(!smort.plot[i])
          {
            //show_json(smort.plot[i]);
            //show_json(i);
            log("error " + i +"/"+smort.plot.length+"/"+debog)
            //show_json(smort.plot);
          }
          if(smort.plot[i].map == character.map)
          {
            //log(cum_dist);
            if(taxi_dist(smort.plot[i]) >= 500)
            {
              blink_push = smort.plot.slice(i);
              parent.use_skill("blink",[smort.plot[i].x,smort.plot[i].y])
              //smart.plot = smort.plot.slice(i);
              //show_json(smart.plot.slice(0,5));
              //smort.plot.splice(0,i);
            }
            break;
          }
        }
      }
      //if i rly code this i also need to code magiport
    }
  }
}

setInterval(function(){
  if(character.map == "cyberland")
  {
    parent.socket.emit("eval", {command:"stop"})
    parent.socket.emit("eval", {command:"give spares"})
  }
    
},500);