const logUtil = require("../../logUtil").log; //日志封装
const mysql_connect = require("../../mysql/mysql_connection");

let controller = {};
module.exports = controller;

controller.poi_list = function(request, response) {
    let sql = "SELECT * FROM hzc_monitor.tbl_zzc_spide_config where active=1;";
    mysql_connect.query(sql, "_82").then(function(result) {
        response.writeHead(200, { 'Content-Type': 'json/application' });
        if (result.err) {
            logUtil.log(result.err);
            return response.end(JSON.stringify({ "success": 0, "msg": result.err }));
        }
        return response.end(JSON.stringify({ "success": 1, "data": result.result }));
    })
}

controller.save_item = function(item, request, response) {
    logUtil.log(item);
    var list = [item.country_name, item.city_name, item.city_id, item.airport_name, item.place_id, 1, 1, item.zzc_city_id, item.zzc_place_id];
    let sql = "INSERT INTO `hzc_monitor`.`tbl_zzc_spide_config` (`country_name`, `city_name`, `city_id`, `place_name`, `place_id`, `is_airport`, `place_type`, `zzc_city_id`, `zzc_place_id`) VALUES ?";
    mysql_connect.excute(sql, [list], "_82").then(function(result) {
        response.writeHead(200, { 'Content-Type': 'json/application' });
        if (result.err) {
            logUtil.log(result.err);
            return response.end(JSON.stringify({ "success": 0, "msg": result.err }));
        }
        return response.end(JSON.stringify({ "success": 1, "data": result.result }));
    });
}