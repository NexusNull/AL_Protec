'use strict';

globalThis.al_storage = (function(){
  const sto = {};
  const expose = make_exposure(sto);
  const slot_no = 73;
  const slot_name = "al_storage";
  const variables = {};

  if(parent.caracAL) {
    globalThis.load_code = function(name_or_slot,onerror)
    {//its a shitty shitty workaround.
      fetch("https://adventure.land/code.js?name="+encodeURIComponent(name_or_slot)+"&timestamp="+(new Date().getTime()), {
        headers: {"Cookie": "auth=" + parent.user_id+"-"+parent.user_auth}
      }).then(x=>x.text()).then(x=>(1,eval)(x));
    }
  }

  function write()
  {
    return upload_code(slot_no,slot_name,
      "al_storage.update_all(\n"
      + JSON.stringify(variables,null,2)
      +"\n,true);al_util.log(\"loaded al_storage from CODE\");");
  }
  
  expose(
  function update_all(object, silently=false)
  {
    if(!object) return;
    for(let key in object)
      variables[key] = object[key];
    if(!silently)
    {
      write();
      let cnt = 0;
      parent.X.characters.forEach(char => {
        if(char && char.server && char.name != character.name)
          if(char.server == parent.server_region+parent.server_identifier)
          {
            //send cm
            send_cm(char.name,
              {"al_storage":object});
          }
          else
          {
            //send pm
            setTimeout(()=>
              parent.socket.emit("say", {
                message: JSON.stringify({"al_storage":object}),
                name: char.name
            }),550 * cnt);
            cnt += 1;
            
          }
      });
    }
  });
  
  expose(
  function set(k,v)
  {
    const obj = {};
    obj[k] = v;
    return sto.update_all(obj);
  });

  expose(
  function get(key)
  {
    return variables[key];
  });

  expose(
  class Char_Key {
    constructor(_key) {
      this.key = _key;
    }

    _access(_char = character.name){
      return "c_"+_char+"_"+this.key;}

    update(val, _char = character.name){
      return sto.set(this._access(_char),val);}

    obtain(_char = character.name){
      return sto.get(this._access(_char));}
    
    update_all(val)
    {
      const delta = {};
      for(let profile of parent.X.characters)
        {delta[this._access(profile.name)] = val;}
      return sto.update_all(delta);
    }
  });

  expose(
  class Global_Key {
    constructor(_key) {
      this.key = _key;
    }

    _access(){
      return "g_"+this.key;}

    update(val){
      return sto.set(this._access(),val);
    }

    obtain(){
      return sto.get(this._access());
    }
  });

  character.on("cm",data=>{
    if(!al_social.is_mine(data.name))
      return;
    if(!data.message?.al_storage) 
      return;
    sto.update_all(data.message.al_storage,true);
  });

  al_util.psock_on('pm', function(data) {
    if(data.owner == character.name)
      return;
    if(!al_social.is_mine(data.owner))
      return;
    try {
      const obj = JSON.parse(data.message);
      if(!obj?.al_storage) 
        return;
      sto.update_all(obj.al_storage,true);
    } catch (e) {
      //pm is not in our format; omit
    }
  });

  expose(
  function reload()
  {
    //doesnt work in albot
    if(parent.X.codes[slot_no])
      load_code(slot_no);
  });

  return sto;
})();

(function(){ 
  al_storage.reload();
})();