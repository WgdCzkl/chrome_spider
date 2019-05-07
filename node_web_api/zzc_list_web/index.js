//引入依赖
const logUtil = require("../logUtil").log; //日志封装
const shop_service = require("./shop_service"); //租租车门店数据获取服务;
const city_service = require("./city_service"); //租租车城市数据获取服务;
const landmark_service = require("./landmark_service"); //租租车界标数据获取服务;
let http = require('http');
var url = require("url");

var server = http.createServer(function (request, response) {
    // 设置接收数据编码格式为 UTF-8
    request.setEncoding('utf-8');
    request.setTimeout(1000 * 180);
    response.setTimeout(1000 * 180);

    var pathname = url.parse(request.url).pathname;
    switch (pathname) {
        case "/init_city_data_from_api":
            city_service.initCiytData(function () {
                logUtil.log('initCiytData response');
                response.writeHead(200, {'Content-Type': 'json/application'});
                // 发送响应数据 "Hello World"
                response.end(JSON.stringify({"success": 1, "msg": ''}));
            });
            break;
        case "/get_city_data_from_api":
            city_service.getALLCiytSpideData(request, response);
            break;
        case "/get_landmarki_data_from_api":
            landmark_service.getAllLandmarkListtData(request, response);
            break;
        case "/get_wait_spide_landmarki_data_from_api":
            landmark_service.getWaitSpideLandmarkList(request, response);
            break;
        case "/spider":
            var postData = "";
            // 数据块接收中
            request.addListener("data", function (postDataChunk) {
                postData += postDataChunk;
            });
            // 数据接收完毕，执行回调函数
            request.addListener("end", function () {
                let config = JSON.parse(postData);
                landmark_service.getLandmarkListData(config, function (result) {
                    let success = 0;
                    let err_msg = '';
                    if (result && result.length > 0)
                        success = 1;
                    else {
                        err_msg = '异常';
                    }
                    shop_service.getAllShopData(config, function (err_shop, result_shop) {
                        logUtil.log('getAllShopData response');
                        response.writeHead(200, {'Content-Type': 'json/application'});
                        // 发送响应数据 "Hello World"
                        response.end(JSON.stringify({"success": success, "msg": err_msg}));
                    })
                })
            });
            break;
    }

}).listen(5003);

server.setTimeout(1000 * 180);

// 终端打印如下信息
logUtil.log('Server running at http://127.0.0.1:5003/');