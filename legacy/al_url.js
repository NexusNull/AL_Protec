window.headless_key = new aland_storage.Char_key("_headless");
window.scale_key = new aland_storage.Char_key("_scale");
//TODO turn these into keys 
window.merchant_region="US"
window.merchant_server="II"
log("merch reg set");
window.realm_key = new aland_storage.Char_key("_realm");
const own_code_slot = parent.new_code_slot || parent.code;

//const serv_components = char.server.split(/(EU|US|ASIA)/);
function realm_components(realm)
  {return realm.split(/(EU|US|ASIA)/);}

function correct_server()
{
  if(!realm_key.get()) return;
  const cur_components = realm_components(realm_key.get());
  console.log(cur_components);
  if(parent.server_region != cur_components[1] || parent.server_identifier != cur_components[2])
    hop_server(cur_components[1], cur_components[2]);
}

//returns the number of the codefile we are running in
function code_splorp()
{
  return own_code_slot;
}

function adjust_url()
{
  const is_headless = parent.no_html && parent.is_bot && parent.no_graphics;
  const url_vars = "?code=" + code_splorp() 
    + (headless_key.get() ? "&no_html=bot&is_bot=1&no_graphics=true":"")
    + (scale_key.get() ? "&scale="+scale_key.get():"");
  
  if(!is_headless == headless_key.get() || (!is_headless && scale_key.get() && scale_key.get() != parent.scale))
  {
    //console.log("Leaving due to parameters :" + (!is_headless == headless_key.get()) + " " + scale_key.get() + " "+scale_key.get() != parent.scale)));
    parent.location.search=url_vars;
    //if u leave out the .search it will navigate to the
    //iframe address instead of the parent address
  }
  else if(!parent.code || parent.code != code_splorp())
    {parent.history.replaceState({}, character.name+"["+code_splorp()+"]", url_vars);}
}

function hop_server(region,ident)
{
  parent.location.pathname="/character/"+character.name+"/in/"+region+"/"+ident+"/";
}
//merchant realm must be before player realm
const realm_list = [
  "EUI",
  "EUII",
  "EUPVP",
  "USI",
  "USII",
  "USIII",
  "USPVP",
  "ASIAI"
]

if(realm_key.get())
{
	realm_list.splice(realm_list.indexOf(realm_key.get()),1);
	realm_list.splice(realm_list.indexOf(merchant_region+merchant_server),1);
	realm_list.push(merchant_region+merchant_server);
	realm_list.push(realm_key.get());
}
//merchant realm needs to be followed by realm key
function hop_realm(realm)
{
  const rulm_components = realm_components(realm);
  parent.location.pathname="/character/"+character.name+"/in/"+rulm_components[1]+"/"+rulm_components[2]+"/";
}

function hop_next_realm()
{
  let next_realm = realm_list[(realm_list.indexOf(parent.server_region+parent.server_identifier)+1)%realm_list.length];
  if(next_realm == "USPVP") 
    {next_realm = realm_list[(realm_list.indexOf("USPVP")+1)%realm_list.length];}
  hop_realm(next_realm);
}

function relog() {
  if(parent.cli_require)
    {parent.CLI_OUT.push({type:"kill"});}
  else
    {return parent.location.reload();}
}
function external_deploy(char_name)
{//the code parameter seems to do nothing
  return window.open("/character/"+char_name+"/in/"+parent.server_region+"/"+parent.server_identifier+"/?code="+code_splorp()
  + (headless_key.get(char_name) ? "&no_html=bot&is_bot=1&no_graphics=true":"")
  + (scale_key.get(char_name) ? "&scale="+scale_key.get(char_name):""));
}

function switch_char(char_name)
{
  parent.location = ("/character/"+char_name+"/in/"+parent.server_region+"/"+parent.server_identifier+"/?code="+code_splorp()
  + (headless_key.get(char_name) ? "&no_html=bot&is_bot=1&no_graphics=true":"")
  + (scale_key.get(char_name) ? "&scale="+scale_key.get(char_name):""));
}

function close_window()
{
  const elec = require && require('electron');
  if(elec) {
    const remote = elec.remote;
    const cur_window = remote.getCurrentWindow();
    cur_window.removeAllListeners("close");
    cur_window.close();
  }
  else 
    {parent.location.href="about:blank";}
}