/*
租租车CarList接口数据抓取
*/

//引入依赖
const logUtil = require("../logUtil").log; //日志封装
const moment = require("moment"); //日期时间处理 
const fs = require("fs"); //文件读写
const async = require("async"); //异步流程控制
const superagent = require('superagent'); //客户端请求代理模块

let util = {};
module.exports = util;

let zzc_url = "http://w.zuzuche.com/list_new_json_4.php?list_ab_test=&id=";
let result_list = {};

//按照支付方式分页获取接口数据
util.getAllData = function(config, cb) {
    result_list = {};
    let list_param = zzc_url + config.id + "&new=1&payment=";
    let array = [
        { "config": config, "url": list_param + "prepaid", "payment": 2, "page": 1 },
        { "config": config, "url": list_param + "partpaid", "payment": 3, "page": 1 },
        { "config": config, "url": list_param + "postpaid", "payment": 1, "page": 1 }
    ];
    asyncRequest(array, function(err, result_list) {
        saveRequest(config, result_list);
        cb && cb(err, result_list);
    });
}

function asyncRequest(list, cb) {
    logUtil.log(list.length);
    async.mapLimit(list, 1, function(item, callback) {
        getDataWithPayment(item, callback);
    }, function(err, result) {
        if (err) {
            logUtil.log("请求失败");
            logUtil.log(err);
        }
        cb && cb(err, result_list);
    });
}

function getDataWithPayment(item, callback) {
    let url = item.url + "&page=" + item.page;
    logUtil.log("开始请求" + item.url);
    superagent.get(url, function(err, res) {
        if (err) {
            logUtil.log("请求失败:" + item.url);
            logUtil.log(url);
            callback && callback(res);
            return;
        }
        var data = res.body && res.body.data;
        if (!data || !data.list) {
            logUtil.log(url + "请求数据为空");
            callback && callback(res);
            return;
        } else {
            processResponse(item, res);
        }

        if (item.page == 1 && data.info && data.info.total_page > 1) {
            let pageUrlList = buildUrl(item, data.info.total_page);
            asyncRequest(pageUrlList, callback);
        } else {
            callback && callback();
        }
    });
}

function buildUrl(item, total_page) {
    let pageUrlList = [];
    let item_String = JSON.stringify(item);
    for (var page = 2; page <= total_page; page++) {
        let item_new = JSON.parse(item_String);
        item_new.url = item.url + "&page=" + page;
        item_new.page = page;
        pageUrlList.push(item_new);
    }
    return pageUrlList;
}

function processResponse(item, response) {
    let data = response.body.data;
    constructResponse(data, item.config);
    let pickup = item.config.pickup;
    let date = moment(new Date()).format('YYYY-MM-DD');
    let path = "./log/" + date + "/" + pickup.country + "/" + pickup.city + "/";
    let file_name = pickup.code + "-" + item.payment + "-" + item.page + ".json";

    logUtil.checkAndMkdir(path);
    fs.writeFile(path + file_name, JSON.stringify(data, null, 4), function(err) {
        if (err) {
            logUtil.log("写入response失败");
            logUtil.log(err);
        }
    });
}

function saveRequest(config, data) {
    let pickup = config.pickup;
    let date = moment(new Date()).format('YYYY-MM-DD');
    let path = "./log/" + date + "/" + pickup.country + "/" + pickup.city + "/";
    let file_name = pickup.code + "-request.json";

    logUtil.checkAndMkdir(path);
    fs.writeFile(path + file_name, JSON.stringify({ "config": config, "request": data }, null, 4), function(err) {
        if (err) {
            logUtil.log("写入response失败");
            logUtil.log(err);
        }
    });
}

//构造车辆资源报价列表
function constructResponse(cdata, config) {
    constructConfig(config);
    var cars = [];
    console.log("开始解析返回");
    if (cdata == null || cdata.length == 0) return cars;
    for (var i in cdata.list) {
        var cargroup = cdata.list[i];
        if (cargroup.meal_list == null || cargroup.meal_list.length == 0) return cars;
        for (var j in cargroup.meal_list) {
            var shop_group = cargroup.meal_list[j];
            for (var k in shop_group.package_array) {
                var package_group = shop_group.package_array[k];
                var car = {};
                car.cancelPolicy = getPackageTag(package_group.packageTag, 'cancel');
                car.carName = cargroup.car_name;
                car.carNameEn = cargroup.name_en_ori;
                car.cargroupDesc = cargroup.description;
                car.cargroupName = cargroup.model;
                car.confirmPolicy = getPackageTag(package_group.packageTag, 'request');
                car.dailyPrice = package_group.unit_price;
                car.freeTags = getTagName(shop_group.free_tags, shop_group.tags);
                //car.fuelPolicy="";
                car.groupId = cargroup.group_id;
                car.insuranceType = package_group.package;
                //car.mileLimit="";
                car.paymentType = 2;
                car.pickupShopAddress = cdata.shop[shop_group.pickup_shop] && cdata.shop[shop_group.pickup_shop].address;
                car.pickupShopId = shop_group.pickup_shop;
                car.possibleCars = shop_group.similar_car_params ? shop_group.similar_car_params : "";
                car.referenceName = cargroup.reference;
                car.returnShopAddress = cdata.shop[shop_group.dropoff_shop] && cdata.shop[shop_group.dropoff_shop].address;
                car.returnShopId = shop_group.dropoff_shop;
                car.seat = cargroup.seat;
                //特色服务
                car.shopTags = JSON.stringify(package_group.packageTag);
                car.totalPrice = package_group.total_price;
                car.transmission = cargroup.transmission;
                car.vendorId = shop_group.dealer_id;
                car.specify = package_group.fixed;
                car.tipsSub = cdata.shop[shop_group.pickup_shop] && cdata.shop[shop_group.pickup_shop].tips_sub;
                car.returnTipsSub = cdata.shop[shop_group.dropoff_shop] && cdata.shop[shop_group.dropoff_shop].sub_tips_dropoff;
                car.noTpl = getPackageTag(package_group.packageTag, 'no_tpl') ? 1 : 0;
                car.noTp = package_group.not_tp;
                car.mileLimit = "";

                //car.detail_url = 'http://w.zuzuche.com/book/' + package_group.book;
                cars.push(car);
                if (result_list.list) {
                    result_list.list.push(car);
                } else {
                    result_list.list = [];
                    result_list.list.push(car);
                }
            }
        }
    }
}

function constructConfig(config) {
    result_list.clId = config.id;
    result_list.pickupAirportCode = config.pickup.code;
    result_list.pickupCityName = config.pickup.city;
    result_list.pickupCountryName = config.pickup.country;
    result_list.pickupDatetime = config.pick_time;
    result_list.pickupIsAirport = config.pickup.airport;
    result_list.pickupLat = config.pickup.lat;
    result_list.pickupLng = config.pickup.lng;
    result_list.pickupName = config.pickup.name;
    result_list.pickupNameEn = config.pickup.name_en;
    result_list.returnAirportCode = config.dropoff.code;
    result_list.returnCityName = config.dropoff.city;
    result_list.returnCountryName = config.dropoff.country;
    result_list.returnDatetime = config.dropOff_time;
    result_list.returnIsAirport = config.dropoff.airport;
    result_list.returnLat = config.dropoff.lat;
    result_list.returnLng = config.dropoff.lng;
    result_list.returnName = config.dropoff.name;
    result_list.returnNameEn = config.dropoff.name_en;
    result_list.zzcPackageCount = config.zzcPackageCount;
}

//获取指定服务
function getPackageTag(list, tag) {
    for (var i in list) {
        var key = list[i];
        if (key.indexOf(tag) > -1) {
            return key;
        }
    }
}

function getTagName(free_tags, tags) {
    var result = getTag(free_tags);
    result = result.concat(getTag(tags));
    return result.join(",");
}

function getTag(tags) {
    var result = [];
    if (!tags) return result;
    for (var i = 0, len = tags.length; i < len; i++) {
        result.push(tags[i].name);
    }
    return result;
}