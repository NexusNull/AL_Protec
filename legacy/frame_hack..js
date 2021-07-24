//file al_loader.js
//ADJUST base url/directory for your setup
//and HARDCODE this into CODE.

window.al_loader = {};

//web mode works in browsers and standalone
//if you use github you have to use GITHUB PAGES
const base = "http://rayla.local/aland_bot/";
//file mode works only in standalone
//const base = "file://Z:\\py_webserver\\aland_bot\\"
al_loader.l = function (source) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.onload = resolve;
        script.onerror = reject;
        script.type = "text/javascript";
        script.async = true;
        script.src = base + source + "?now=" + Date.now();
        document.getElementsByTagName("head")[0].appendChild(script);
    });
}
const l = al_loader.l;

l("aland_loggi.js")
    .then(_ev => l("frame_other.js"))
    .then(_ev => l("mainframe.js"))
    .catch(error => [log(error), console.log(error)]);

l("path_ex.js");