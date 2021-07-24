setInterval(function () {
    if (character.map == "cyberland")
        parent.socket.emit("eval", {command: "stop"})
}, 500);
window.frame_word_list = [];
var m_frame_i = 28000;
var t_words = {};

setInterval(function () {
    if (character.map == "cyberland" && frame_word_list.length >= 2000) {
        parent.socket.emit("eval", {command: "give " + frame_word_list[m_frame_i]});
        log("give " + frame_word_list[m_frame_i]);
        aland_loggi.log("give " + frame_word_list[m_frame_i]);
        //parent.socket.emit("eval", {command:"swap "+Math.floor(Math.random()*42) + " " + Math.floor(Math.random()*42)})
        t_words[frame_word_list[m_frame_i]] = (t_words[frame_word_list[m_frame_i]] || 0) + 1;
        m_frame_i++;
        m_frame_i = m_frame_i % frame_word_list.length;
    }
}, 150);

parent.socket.on("chat_log", function (a) {
    if ("mainframe" == a.id)
        aland_loggi.log(JSON.stringify(a));
});
