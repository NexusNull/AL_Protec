//file al_loader.js
//ADJUST base url/directory for your setup
//and HARDCODE this into CODE.

if (require && !parent.is_electron)//node env albot
{
    //global.globalThis={};
    console.log("global is" + global)
}
console.log("global is" + global)
globalThis.al_loader = {};
globalThis.al_loader.is_albot = require && !parent.is_electron;
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
if (globalThis.al_loader.is_albot) {
    al_loader.l = function (source) {
        return new Promise(function (resolve, reject) {
            let file_text = fs.readFileSync('CODE/' + source) + '';
            eval(file_text);
            resolve("Sucess!");
        });
    }
}


const l = al_loader.l;

l("aland_storage.js")
    .then(_ev => l("aland_loggi.js"))
    .then(_ev => l("al_url.js"))
    .then(_ev => l("al_auto.js"))
    .then(_ev => l("al_path.js"))
    .then(_ev => l("konami.js"))
    .then(_ev => l("al_observer.js"))
    .then(_ev => l("targeting_logic.js"))
    .then(_ev => l("al_items.js"))
    .then(_ev => l("adventurer.js"))
    .catch(error => [log(error), console.log(error)]);

l("path_ex.js");