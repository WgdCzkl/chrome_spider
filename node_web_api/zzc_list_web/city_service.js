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
        city_html_url: 'http://www.zuzuche.com/guide/',
        city_url: 'http://www.zuzuche.com/guide/get_region_city.php?region=',
    },
    region: {
        min: 10001,//10001
        max: 10356,//10356,
    },
    db_config:'_staging',
    save_cb: {
        is_start: 0,
        count: 0,
        wait: 0,
        callback: null,
    }
};

util.checkComplete = function () {
    global_data.save_cb.wait--;
    if (global_data.save_cb.wait == 0) {
        global_data.save_cb.callback();
    }
}


//获取所有城市接口数据
util.getALLCiytSpideData = function (request, response) {
    let sql = "SELECT " +
        "    c.*,l.landmarki_count,l.spide_count,l.spide_time" +
        " FROM " +
        "    hzc_monitor.reptile_zzc_citys AS c" +
        "        LEFT JOIN" +
        "    (SELECT " +
        "        city_id," +
        "            COUNT(1) landmarki_count," +
        "            MAX(spide_time) spide_time," +
        "            COUNT(spide_time) spide_count" +
        "    FROM" +
        "        hzc_monitor.reptile_zzc_landmarkis" +
        "    GROUP BY city_id) AS l ON c.city_id = l.city_id" +
        " WHERE " +
        "    c.active = 1;";
    mysql_connect.query(sql, global_data.db_config).then(function (result) {
        response.writeHead(200, {'Content-Type': 'json/application'});
        if (result.err) {
            return response.end(JSON.stringify({"success": 0, "msg": result.err}));
        }
        return response.end(JSON.stringify({"success": 1, "data": result.result}));
    });
}

//获取所有城市接口数据
util.getAllCiytData = function (request, response) {
    let sql = "SELECT * FROM hzc_monitor.reptile_zzc_citys where active=1;";
    mysql_connect.query(sql, global_data.db_config).then(function (result) {
        response.writeHead(200, {'Content-Type': 'json/application'});
        if (result.err) {
            return response.end(JSON.stringify({"success": 0, "msg": result.err}));
        }
        return response.end(JSON.stringify({"success": 1, "data": result.result}));
    });
}

//初始化城市接口数据
util.initCiytData = function (cb) {
    global_data.save_cb.is_start = 0;
    global_data.save_cb.callback = cb;
    let region = global_data.region.min;
    util.get_city_by_https(region);
}

util.get_city_by_https = function (region) {
    superagent.get(global_data.url.city_url + region.toString(), function (err, res) {
        if (res && res.statusCode == 200) {
            let city_list = JSON.parse(res.text).data;
            if (region >= global_data.region.max) {
                global_data.save_cb.is_start = 1;
                global_data.save_cb.count = city_list.length;
                global_data.save_cb.wait = global_data.save_cb.count;
            }
            let city_index = 0;
            util.next_city(city_list, city_index, region)
        }
    });
}

util.next_region = function (region) {
    region = parseInt(region);
    if (region <= global_data.region.max) {
        region++;
        util.get_city_by_https(region)
    }
}

util.next_city = function (city_list, city_index, region) {
    if (city_list.length) {
        if (city_list[city_index])
            util.save_city(city_list[city_index], function () {
                city_index++;
                if (city_index <= city_list.length - 2)
                    util.next_city(city_list, city_index, region)
                else
                    util.next_region(region)
            })
    }
    else {
        util.next_region(region)
    }
}

util.save_city = function (city, cb) {
    var list = [city.city, city.city_cn, city.city_en, city.region, city.region_cn];
    let sql = "INSERT INTO `hzc_monitor`.`reptile_zzc_citys`(`city_id`,`city_name_cn`,`city_name_en`,`region_id`,`region_name_cn`) VALUES ?";
    mysql_connect.excute(sql, [list], global_data.db_config).then(function (result) {
        if (global_data.save_cb.is_start) {
            if (parseInt(city.region) == global_data.region.max)
                util.checkComplete();
        }
        cb();
    });
}

