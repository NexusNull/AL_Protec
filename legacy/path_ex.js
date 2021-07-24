//this wont be part of the module based loading initally


const width = 1200
const height = 600


var canvas = document.createElement("CANVAS");
if (navigator.userAgent.includes("jsdom"))
    console.log("Canvas not supported. Not drawing pretty pictures")
else {

    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#222222";


    ctx.fillRect(0, 0, width, height);

    var map_base_name = "main";
    var map_base = G.geometry[map_base_name];

    function _t(x, y) {
        return [
            width * (x - map_base.min_x) / (map_base.max_x - map_base.min_x),
            height * (y - map_base.min_y) / (map_base.max_y - map_base.min_y),
        ];
    }

    function map_line(x1, y1, x2, y2) {
        ctx.beginPath();
        [x1, y1] = _t(x1, y1);
        [x2, y2] = _t(x2, y2);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    var anchors = {};
    var anchors_array = []

    function generate_anchors(x, y) {
        var offsets = [
            [-character.base.h, -character.base.vn],
            [character.base.h, -character.base.vn],
            [character.base.h, character.base.v],
            [-character.base.h, character.base.v]
        ];
        for (var i = 0; i < 4; i++) {
            var cur_off = offsets[i];
            var n_x = x + cur_off[0];
            var n_y = y + cur_off[1];
            var cur_pos = [n_x, n_y];
            //x,y,going_x,going_y
            if (!anchors[cur_pos]
                && can_move({
                    x: n_x, y: n_y,
                    going_x: x, going_y: n_y, map: map_base_name
                })
                && can_move({
                    x: n_x, y: n_y,
                    going_x: n_x, going_y: y, map: map_base_name
                })) {
                anchors_array.push(cur_pos);
                anchors[cur_pos] = {};
            }
        }
        return anchors;
    }

    ctx.strokeStyle = 'red';
    map_base.x_lines.forEach(line => {
        generate_anchors(line[0], line[1]);
        generate_anchors(line[0], line[2]);
        return map_line(line[0], line[1], line[0], line[2]);
    });
    ctx.strokeStyle = 'green';
    map_base.y_lines.forEach(line => {
        generate_anchors(line[1], line[0]);
        generate_anchors(line[2], line[0]);
        return map_line(line[1], line[0], line[2], line[0]);
    });
    ctx.strokeStyle = 'cyan';
//anchors = anchors.sort((a,b)=>b[1]-a[1]).sort((b,a)=>b[0]-a[0]);
    var town_place = G.maps[map_base_name].spawns[0];
    var inside_index = anchors_array.findIndex(point => can_move({
        x: point[0], y: point[1],
        going_x: town_place[0], going_y: town_place[1], map: map_base_name
    }));
    var inside_array = [anchors_array[inside_index]];
    anchors_array.splice(inside_index, 1);
//Filter out outside nodes
    var j = 0;
    while (j < inside_array.length) {
        var last_inside = inside_array[j];
        for (var i = j + 1; i < inside_array.length; i++) {
            var elem = inside_array[i];
            if (can_move({
                x: last_inside[0], y: last_inside[1],
                going_x: elem[0], going_y: elem[1], map: map_base_name
            })) {//TODO annotate with dist instead of 15
                anchors[last_inside][elem] = 15;
                anchors[elem][last_inside] = 15;
                //map_line(last_inside[0],last_inside[1],elem[0],elem[1]);
            }
        }
        for (var i = anchors_array.length - 1; i >= 0; i--) {
            var elem = anchors_array[i];
            if (can_move({
                x: last_inside[0], y: last_inside[1],
                going_x: elem[0], going_y: elem[1], map: map_base_name
            })) {//TODO annotate with dist instead of 15
                anchors[last_inside][elem] = 15;
                anchors[elem][last_inside] = 15;
                anchors_array.splice(i, 1);
                inside_array.push(elem);
                //map_line(last_inside[0],last_inside[1],elem[0],elem[1]);
            }
        }
        j++;
    }
    ctx.strokeStyle = 'yellow';

    inside_array.forEach(([_x, _y]) => {
        [x, y] = _t(_x, _y);
        var cross_dist = 2;
        ctx.beginPath();
        ctx.moveTo(x - cross_dist, y - cross_dist);
        ctx.lineTo(x + cross_dist, y + cross_dist);
        ctx.stroke();
        ctx.moveTo(x - cross_dist, y + cross_dist);
        ctx.lineTo(x + cross_dist, y - cross_dist);
        ctx.stroke();

    });


    log(anchors_array.length);
    log(inside_array.length);
//G.maps.[name].spawns[0]
//is identic to use_town

    var filePath = require("path").join(require('os').homedir(), "aland", "test.png");
// Get the DataUrl from the Canvas
    const url = canvas.toDataURL('image/png', 0.8);

// remove Base64 stuff from the Image
    const base64Data = url.replace(/^data:image\/png;base64,/, "");
    require("fs").writeFile(filePath, base64Data, 'base64', function (err) {
        console.log(err);
    });

    function ident_line() {
        for (var i = 0; i < map_base.y_lines.length; i++) {
            var line = map_base.y_lines[i];
            if (line[0] >= 1225 && line[0] <= 1240 && line[2] >= -732)
                return i;
        }
    }

    function ident_lines() {
        return map_base.y_lines.filter(line => (line[0] >= 1225 && line[0] <= 1240 && line[2] >= -800 && line[2] <= -400));
    }
}