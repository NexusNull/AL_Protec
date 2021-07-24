//also not part of the initial draft


//get a promise that computes a path of smart_move
function swag_move(destination)
{
  var promise = push_deferred("swag_move");
  smart_move(destination).catch(err=>{
    reject_deferreds("swag_move",err);
  });
  smart._computing = true;
  return promise
}

bfs = (function(_super) {
  //patch the progress function of smart-moving
  return function() {
    _super.apply(this, arguments);
    if(!smart._computing) return;
    if(smart.found) 
    {
      smart.moving = false;
      resolve_deferreds("swag_move",{success:true, path:smart.plot});
    }
  };
})(bfs);

function AL_Path(){
  this.plot = [];
  this.pointer = 0;
}

AL_Path.prototype = {
  constructor: AL_Path,
  walk: function(tipple, backwards){
    if(!this.forward_steps_left()) return;
    var current=this.plot[this.pointer];
		this.pointer++;
		if(current.town)
		{
			use("town");
		}
		else if(current.transport)
		{
			parent.socket.emit("transport",{to:current.map,s:current.s});
		}
    else 
    {
      var t_x = current.x
      var t_y = current.y
      if(tipple)
      {
        var d_x = t_x - character.real_x
        var d_y = t_y - character.real_y
        var d_len = Math.sqrt(d_x * d_x + d_y * d_y)
        d_x = d_x / d_len
        d_y = d_y / d_len
        if(d_len > 35)
        {
          t_x = character.real_x + d_x * 35
          t_y = character.real_y + d_y * 35
          this.pointer--;
        }
      }
      if(character.map==current.map && (!this.forward_steps_left() || can_move_to(t_x,t_y)))
        move(t_x,t_y);
    }
  },
  forward_steps_left: function()
  {
    return this.pointer < this.plot.length;
  },
  backward_steps_left: function()
  {
    return this.plot && this.pointer > 0;
  }
}