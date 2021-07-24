'use strict';
globalThis.make_exposure = function make_exposure(container){
  return function expose(func,name=func.name){
    container[name] = func;
  }
}
globalThis.al_util = (function(){
  const ut = {};
  const expose = make_exposure(ut);

  const behaviours = {};
  expose(
  function register_behaviour(timeout,func,name = func.name)
  {
    behaviours[name] = [func,timeout]
  });
  expose(
  function recommended_monitoring_interval()
  {
    return 1000 / 10;
  });
  expose(
  function flatten(arr) {
    return [].concat.apply([], arr);
  });

  expose(
  function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }
    if (typeof step == 'undefined') {
        step = 1;
    }
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }
    const result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }
    return result;
  });

  let run_loop = {};
  //TODO maybe turn this into a case by case thing
  expose(
  function start_behaviours()
  {
    for(let k in behaviours)
    {
      if(run_loop[k])
        continue;
      const [func,timer] = behaviours[k];
      run_loop[k] = setInterval(func,timer);
    }
  });

  expose(
  function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  });

  expose(
  function old_date() {
    return 1337;
  });

  expose(
  class Timeout {
    constructor(_period) {
      this._timeout = _period;
      this._next_op = ut.old_date();
    }

    unlocked() {
      return this._next_op <= Date.now();
    }

    execute(operations, multiples = false)
    {
      const ops = multiples ? operations : [operations];
      if(!this.unlocked()) 
        return false;
      let timeout = 0;
      const result = [];
      for(let i = 0; i < ops.length; i++)
      {
        result.push(ops[i]());
        timeout += i == 0 ? this._timeout : this._timeout / 2;
      }
      this._next_op = Date.now() + timeout;
      return ut.sleep(timeout).then(x=>result);
    }

    lock()
    {
      return this.execute(()=>false);
    }
  });
  expose(
  class Ring {
    constructor(src_func) {
      this._src_func = src_func;
      this._index = 0;
    }

    next() {
      const src = this._src_func();
      if(src.length <= 0)
        return null;
      this._index = (this._index+1) % src.length;
      return src[this._index];
    }
  });
  const DEFAULT_GRACE_PERIOD = 220;
  expose(
  function recommended_grace_period() {
    return DEFAULT_GRACE_PERIOD;
  });

  expose(
  function log(msg,color){
    return game_log(msg,color);
  });

  const sock_listeners = {};
  expose(
  function psock_on(name,func)
  {
    if(!sock_listeners[name])
      sock_listeners[name] = [];
    sock_listeners[name].push(func);
    parent.socket.on(name,func);
  });

  const old_cleanup = globalThis.on_destroy;
  globalThis.on_destroy = function()
  {
    for(let k in sock_listeners) {
      for(let func of sock_listeners[k]) {
        parent.socket.off(k,func);
      }
    }
    return old_cleanup();
  }

  expose(
  function is_hardcore() {
    return "hardcore" == parent.gameplay;
  });

  return ut;
})();