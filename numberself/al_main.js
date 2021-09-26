globalThis.al_main = (function () {
    function is_albot() {
        return parent.require && !parent.is_electron;
    }

    function load_script_browser(source) {
        //web mode works in browsers and standalone
        //if you use github you have to use GITHUB PAGES
        const base = "http://rayla.local/cara-link/";
        //file mode works only in standalone
        //const base = "file://Z:\\py_webserver\\aland_bot\\rewrite\\"
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

    function load_script_albot(source) {
        console.log("loading source " + source);
        const fs = parent.require('fs').promises;
        return fs.readFile("./CODE/" + source, "utf8")
            .then(txt => (1, eval)(txt + "\n//# sourceURL=" + source));
    }

    function cara_load_script(source) {
        console.log("loading source " + source);
        return parent.caracAL.load_scripts([source]);
    }

    const loadr = parent.caracAL ? cara_load_script : is_albot() ? load_script_albot : load_script_browser;

    return {is_albot, load: loadr};
})();

(function () {
    const l = al_main.load;

    globalThis.log("al_main.js: beginning load")
    l("al_util.js")
        .then(_ev => l("al_influx.js"))
        .then(_ev => l("al_deploy.js"))
        .then(_ev => l("al_social.js"))
        .then(_ev => l("al_storage.js"))
        .then(_ev => l("al_items.js"))
        .then(_ev => l("al_basic_behaviours.js"))
        .then(_ev => l("al_looting.js"))
        .then(_ev => l("al_desires.js"))
        .then(_ev => l("al_goldspin.js"))
        .then(_ev => l("al_hacks.js"))
        .then(_ev => al_util.start_behaviours())
        .then(_ev => log("al_main.js: finished load"))
        .catch(error => [globalThis.log(error), console.log(error)]);
})();