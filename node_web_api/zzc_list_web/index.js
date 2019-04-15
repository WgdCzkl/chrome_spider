//引入依赖
const logUtil = require("../logUtil").log; //日志封装
const list_service = require("./list_service"); //租租车Carlist数据获取服务;
const api_service = require("./api_service"); //内部接口
let http = require('http');
var url = require("url");
let poi_controller = require("./controller/poi");

//let config = { "id": 75073023, "pickup": { "airport": 1, "lat": 33.9415889, "lng": -118.40853, "name": "洛杉矶国际机场", "name_en": "Los Angeles Airport", "country": "美国", "city": "洛杉矶", "code": "LAX" }, "dropoff": { "airport": 1, "lat": 33.9415889, "lng": -118.40853, "name": "洛杉矶国际机场", "name_en": "Los Angeles Airport", "country": "美国", "city": "洛杉矶", "code": "LAX" }, "pick_time": "2018-10-29T13:30", "dropOff_time": "2018-10-31T20:00" };

var server = http.createServer(function(request, response) {
    // 设置接收数据编码格式为 UTF-8
    request.setEncoding('utf-8');
    request.setTimeout(1000 * 180);
    response.setTimeout(1000 * 180);

    var pathname = url.parse(request.url).pathname;
    logUtil.log(pathname);
    if (pathname == "/poi_list.json") {
        poi_controller.poi_list(request, response);
    } else {
        var postData = "";
        // 数据块接收中
        request.addListener("data", function(postDataChunk) {
            postData += postDataChunk;
        });
        // 数据接收完毕，执行回调函数
        request.addListener("end", function() {
            logUtil.log('数据接收完毕');
            let config = JSON.parse(postData);
            if (pathname == "/save_to_spide_config") {
                poi_controller.save_item(config, request, response);
            } else {
                list_service.getAllData(config, function(err, result) {
                    if (err) {
                        logUtil.log(err);
                    }
                    logUtil.log("爬取完成");
                    api_service.save_zzc_list(result, function(err, result) {
                        if (err) {
                            logUtil.log("请求异常");
                            logUtil.log(err);
                        }
                        response.writeHead(200, { 'Content-Type': 'json/application' });
                        // 发送响应数据 "Hello World"
                        response.end(JSON.stringify({ "success": result.result, "msg": result.error }));
                    });
                });
            }
        });
    }
}).listen(5000);

server.setTimeout(1000 * 180);

// 终端打印如下信息
logUtil.log('Server running at http://127.0.0.1:5000/');