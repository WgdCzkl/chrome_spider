/*
租租车搜索框接口数据抓取
*/

//引入依赖
const logUtil = require("../logUtil").log; //日志封装
const moment = require("moment"); //日期时间处理 
const fs = require("fs"); //文件读写
const async = require("async"); //异步流程控制
const superagent = require('superagent'); //客户端请求代理模块
const jsonp = require('superagent-jsonp');

var cityArray = [];
var allCity = [];

getHotCities();

function getHotCities() {
    let url = "http://w.zuzuche.com/api/get_region_city_pickup_json_3.php?from=pc&callback=jQuery17206526576705313394_1540262417773&action=history&from=pc&_=1540263962700";
    spiderUrl(url);
}

function spiderUrl(url, callback) {
    superagent.get(url).accept('json').buffer().use(jsonp).end(function(err, response) {
        if (err) {
            logUtil.log("失败");
            logUtil.log(err);
            return;
        }
        eval(response.text);
        callback && callback();
    });
}

function jQuery17206526576705313394_1540262417773(data) {
    if (data.state) {
        transformToCityArray(data.info);
        getAllCityByCountries(data.info.host_list);
    }
}

function transformToCityArray(info) {
    let hotcities = info.hotCities;
    for (var i = 0, len = hotcities.length; i < len; i++) {
        let cities = hotcities[i];
        for (var j = 0, l = cities.length; j < l; j++) {
            let city = cities[j];
            cityArray.push(city);
        }
    }
}

function getAllCityByCountries(hot_lab_list) {
    logUtil.log("获取热门国家城市");
    let countryArray = ["美国", "澳大利亚", "新西兰", "加拿大", "泰国", "德国", "意大利", "西班牙", "法国", "土耳其"];
    let city_url = "http://w.zuzuche.com/api/get_region_city_pickup_json_3.php?from=pc&callback=jQuery17206526576705313394_1540262417774&action=city&_=1540275757499&id=";
    async.mapLimit(hot_lab_list, 1, function(item, callback) {
        if (countryArray.indexOf(item.region) != -1) {
            spiderUrl(city_url + item.id, callback);
        } else {
            callback && callback();
        }
    }, function(err, result) {
        deleteDuplicate(allCity, cityArray);
    });
}

function deleteDuplicate(allCity, cityArray) {
    let dict = {};
    for (var i = 0, len = allCity.length; i < len; i++) {
        let city = allCity[i];
        dict[city.city] = city;
    }
    for (let j = 0, l = cityArray.length; j < l; j++) {
        let item = cityArray[j];
        if (!dict[item.city]) {
            let new_item = {};
            new_item.city = item.city;
            new_item.city_en = item.en;
            new_item.city_cn = item.cn;
            new_item.pinyin = item.pinyin;
            new_item.region = item.regon_id;
            new_item.state = item.continent;
            new_item.letter = item.letter;
            new_item.country = item.region;

            dict[item.city] = new_item;
        }
    }
    logUtil.log(dict.keys());
}

function jQuery17206526576705313394_1540262417774(data) {
    let cities = data.letter;
    for (let i = 0, len = cities.length; i < len; i++) {
        let info = cities[i].info;
        for (let j = 0, l = info.length; j < l; j++) {
            let city = info[j];
            allCity.push(city);
        }
    }
}