'use strict';
globalThis.al_influx = (function(){
  const inf = {};
  const expose = globalThis.make_exposure(inf);

  function unravel(obj) {
    return Object.keys(obj)
      .map(x=>x+'='+obj[x]);
  }
  
  const credentials = {
    address:"http://rayla.local:8086",
    user:"al",
    password:"al",
    db:"adventure.land"
  };

  fetch(`${credentials.address}/query`,{
    method: 'POST',
    headers: {
      Authorization: `Token ${credentials.user}:${credentials.password}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: "q="+ encodeURIComponent(`CREATE DATABASE "${credentials.db}"`),
  }).catch(e=>null);

  expose(
  //one field is required
  function post_measure(measure,tags,fields) {
    const firstSection = [measure].concat(unravel(tags)).join(",");
    const secondSection = unravel(fields).join(",");
    if(!secondSection) {
      throw new Error("at least one field is required for post_measure");
    }
    const q_string = `${firstSection} ${secondSection} ${Date.now()}`
    fetch(`${credentials.address}/api/v2/write?bucket=${credentials.db}/&precision=ms`,{
      method: 'POST',
      headers: {
        Authorization: `Token ${credentials.user}:${credentials.password}`,
      },
      body: q_string,
    })
      .then(x=>x.json())
      .then(x=>console.warn("post_measure",x))
      .catch(e=>null);
  });

  

  return inf;
})();