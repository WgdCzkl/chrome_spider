/*
租租车城市接口数据抓取
*/

//引入依赖
const logUtil = require("../logUtil").log; //日志封装
const mysql_connect = require("../mysql/mysql_connection");
const moment = require("moment"); //日期时间处理
const fs = require("fs"); //文件读写
const async = require("async"); //异步流程控制
const superagent = require('superagent'); //客户端请求代理模块

let util = {};
module.exports = util;

var global_data = {
    url: {
        zzc_car_list: 'https://w.zuzuche.com/list.php?new=1&id=',
    },
    db_config:'_staging',
};

//获取所有界标接口数据
util.getAllLandmarkListtData = function (request, response) {
    let sql = "SELECT * FROM hzc_monitor.reptile_zzc_landmarkis where active=1;";
    mysql_connect.query(sql, global_data.db_config).then(function (result) {
        response.writeHead(200, {'Content-Type': 'json/application'});
        if (result.err) {
            return response.end(JSON.stringify({"success": 0, "msg": result.err}));
        }
        return response.end(JSON.stringify({"success": 1, "data": result.result}));
    });
}

//获取界标接口数据
util.getLandmarkListData = function (config, cb) {
    let city_id = config.pickup.zzc_city_id;
    let sql = "SELECT * FROM hzc_monitor.reptile_zzc_landmarkis where active=1 and city_id=" + city_id + ";";
    mysql_connect.query(sql, global_data.db_config).then(function (result) {
        let list = result.result;
        if (list.length < 1) {
            util.setLandmarkData(config, cb);
        }
        else {
            cb(list);
        }
    });
}

util.getWaitSpideLandmarkList = function (request, response) {
    let city_id = request.url;
    city_id = city_id.substring(city_id.indexOf('?city_id=') + 9);
    let sql = "SELECT * FROM hzc_monitor.reptile_zzc_landmarkis where active=1 and spide_time is null and city_id=" + city_id + ";";
    mysql_connect.query(sql, global_data.db_config).then(function (result) {
        response.writeHead(200, {'Content-Type': 'json/application'});
        return response.end(JSON.stringify({"success": 1, "data": result.result}));
    });
}

//写入界标接口数据
util.setLandmarkData = function (config, cb) {
    superagent.get(global_data.url.zzc_car_list + config.id, function (err, res) {
        let landmarkStr = util.subString(res.text, 'window.pageConfig =', 'requestParams:');
        landmarkStr = util.subString(landmarkStr, ',pickUp:', ',dropOff:');
        let landmark_group_list = JSON.parse(landmarkStr);
        let landmark_list = [];
        for (var groupKey in landmark_group_list) {
            let group = landmark_group_list[groupKey].list;
            for (var key in group) {
                landmark_list.push(group[key])
                util.save_landmark(config, group[key])
            }
        }
        cb(landmark_list)
    });
}


util.subString = function (oldStr, startStr, endStr) {
    let start = oldStr.indexOf(startStr) + startStr.length;
    if (oldStr.indexOf(startStr) < 0)
        return '';
    let end = oldStr.indexOf(endStr, start);
    let newStr = oldStr.substring(start, end);
    newStr = newStr.replace(/<\/?.+?>/g, "");
    newStr = newStr.replace(/ /g, "");
    newStr = newStr.replace(/\r/g, "");
    newStr = newStr.replace(/\n/g, "");
    return newStr;
}

util.save_landmark = function (config, landmark) {
    var list = [landmark.id, landmark.name, landmark.type, landmark.lat, landmark.lng, landmark.iata, config.pickup.zzc_city_id];
    let sql = "INSERT INTO `hzc_monitor`.`reptile_zzc_landmarkis`(`landmark_id`,`landmark_name`,`landmark_type`,`lat`,`lng`,`iata`,`city_id`) VALUES ?";
    mysql_connect.excute(sql, [list], global_data.db_config).then(function (result) {

    });
}

