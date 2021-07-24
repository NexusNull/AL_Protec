'use strict';
globalThis.al_deploy = (function () {
    const dep = {};
    const expose = make_exposure(dep);

    expose(
        function components(realm) {
            return realm.split(/(EU|US|ASIA)/).slice(1);
        });

    if (!parent.require || parent.is_electron) {
        //browser or electron
        expose(
            //TODO add code_slot parameter
            function deploy(char_name, realm = parent.server_region + parent.server_identifier) {
                const [region, ident] = dep.components(realm);
                if (!char_name || char_name == character.name) {
                    return (parent.location.pathname = "/character/" + character.name + "/in/" + region + "/" + ident + "/");
                }
                return open("/character/" + char_name + "/in/" + region + "/" + ident + "/?code=" + get_active_code_slot());
            });

        expose(
            function shutdown() {
                const elec = parent.require && parent.require('electron');
                if (elec) {
                    const remote = elec.remote;
                    const cur_window = remote.getCurrentWindow();
                    cur_window.removeAllListeners("close");
                    cur_window.close();
                } else {
                    parent.location = "about:blank";
                }
            });
    } else if (parent.caracAL) {
        //expose caracAL routines
        expose(parent.caracAL.deploy, "deploy");
        expose(parent.caracAL.shutdown, "shutdown");
    }

    return dep;
})();