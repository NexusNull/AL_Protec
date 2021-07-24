var aland_loggi = {
    req: parent.require || parent.cli_require,
    key: function (date) {
        return "aland_loggi" + date.toISOString().substring(0, 10)
    },
    log: function (message) {
        var now = new Date();
        var full_message = "[" + now.toISOString() + "]" + message;
        if (this.req) {
            var fs = this.req("fs");
            var filePath = this.req("path").join(this.req('os').homedir(), "aland", parent.character.name + ".log");
            fs.appendFile(filePath, full_message + "\n", (err) => {
            });
        } else {
            var _key = this.key(now);
            var prev_log = get(_key);
            if (!prev_log) prev_log = [];
            prev_log.push(full_message);
            set(_key, prev_log);
        }
    },
    get: function (date) {
        return get(this.key(date));
    },
    show_prev: function (before) {
        show_json(this.get(new Date().addDays(-before)));
    }
};

Date.prototype.addDays = function (h) {
    this.setTime(this.getTime() + (h * 24 * 60 * 60 * 1000));
    return this;
}
//TODO if my client is graphic i might want to revert
if (aland_loggi.req && parent.no_html && parent.is_bot && parent.no_graphics && parent.console.al_target != parent.character.name) {
    const {Console} = aland_loggi.req('console');
    const fs = aland_loggi.req("fs");
    const filePath = aland_loggi.req("path").join(aland_loggi.req('os').homedir(), "aland", parent.character.name + ".con.log");
    const output = fs.createWriteStream(filePath);
    const new_console = new Console({stdout: output, stderr: output});
    new_console.al_target = character.name;
    parent.console = new_console;
}

window.console = parent.console;