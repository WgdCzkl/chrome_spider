/*
租租车门店接口数据抓取
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
        zzc_list_url: "http://w.zuzuche.com/list_new_json_5.php?new=1&id=",
    },
    db_config: '_staging',
    config: null,
    car_list: [],
    clid: 0,
    city_id: 0,
    landmark_id: 0,
    shop_count: 0,
    save_cb: {
        count: 0,
        wait: 0,
        callback: null,
    },
    init: function (config, cb) {
        global_data.shop_count = 0;
        global_data.config = config;
        global_data.clid = config.id;
        global_data.city_id = config.pickup.zzc_city_id;


        global_data.save_cb.callback = cb;
    }
};

//日期格式化
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


//获取所有供应商门店接口数据
util.getAllShopData = function (config, cb) {
    global_data.init(config, cb);

    superagent.get(global_data.url.zzc_list_url + config.id + "&new=1", function (err, res) {
        var shops = res.body.data.shop;
        let search_param = res.body.data.info.search_param;
        global_data.landmark_id = util.subString(search_param, '&pickup_landmark=', '&dropoff_landmark=')
        global_data.car_list = res.body.data.list;
        logUtil.log(global_data.car_list.length);
        util.get_shop_by(global_data.city_id, global_data.landmark_id, function (old_shop_list) {
            var new_shop_list = [];
            if (old_shop_list.length > 0) {
                for (var key in shops) {
                    if (!util.is_contain_by_db(old_shop_list, parseInt(key))) {
                        if (key.length > 0) {
                            new_shop_list.push(shops[key]);
                        }
                    }
                    global_data.shop_count++;
                }
            }
            else {
                for (var key in shops) {
                    new_shop_list.push(shops[key])
                    global_data.shop_count++;
                }
            }
            global_data.save_cb.count = new_shop_list.length;
            global_data.save_cb.wait = global_data.save_cb.count;
            logUtil.log('shop_count ' + global_data.shop_count);
            logUtil.log('new_shop_list_count ' + new_shop_list.length);
            util.next_shop(new_shop_list, 0);
        })
    });
}


util.next_shop = function (shop_list, shop_index) {
    if (shop_list.length) {
        if (shop_list[shop_index])
            util.getShopDetailData(shop_list[shop_index], function () {
                logUtil.log('next_shop ' + shop_index);
                if (shop_index <= shop_list.length - 2) {
                    shop_index++;
                    util.next_shop(shop_list, shop_index);
                }
                else {
                    util.Complete();
                }
            })
    }
    else {
        global_data.save_cb.callback();
    }
}

util.Complete = function () {
    let sql_up = "update hzc_monitor.reptile_zzc_landmarkis SET spide_time=NOW() WHERE landmark_id=?";
    mysql_connect.excute(sql_up, global_data.landmark_id, global_data.db_config).then(function () {
        logUtil.log('checkComplete callback');
        global_data.save_cb.callback();
    });
}

util.get_book_info = function (shop) {
    for (var carKey in global_data.car_list) {
        bookList = global_data.car_list[carKey].meal_list;
        for (var bookKey in bookList) {
            var bookObj = bookList[bookKey];
            if (bookObj.pickup_shop) {
                if (bookObj.pickup_shop.toString() == shop.id) {
                    var urlParams = bookObj.book.split('-');
                    return {
                        result: true,
                        id: urlParams[1],
                        bid: urlParams[2].replace('.html', ''),
                        shop: shop
                    };
                }
            }
        }
    }
    return {
        result: false,
        id: 0,
        bid: 0,
        shop: shop
    };
}

util.getShopHtmlUrl = function (id, bid) {
    //https://w.zuzuche.com/location_info.php?clid=85847932&id=758589455&bid=5cbd38f61e8192196871ed76
    var url = 'https://w.zuzuche.com/location_info.php?clid=' + global_data.clid + '&id=' + id + '&bid=' + bid;
    return url;
}

util.getBookUrl = function (id, bid) {
    //https://w.zuzuche.com/book/85957301-601723512-5cbfc4b21e819228ac6385e4.html?new=1
    var url = 'https://w.zuzuche.com/book/' + global_data.clid + '-' + id + '-' + bid + '.html?new=1';
    return url;
}

util.getBookMainUrl = function (id, bid) {
    //https://w.zuzuche.com/api/book/view_main.php?clid=85906328&id=848150145&bid=5cbe8558a38b5211d051ae7e&site=alamo&root=848150145&nv=1&clid_easy_rent=&supplier_feature=null
    var url = 'https://w.zuzuche.com/api/book/view_main.php?clid=' + global_data.clid + '&id=' + id + '&bid=' + bid + '&nv=1';
    return url;
}

util.getShopDetailData = function (shop, cb) {
    var book_info = util.get_book_info(shop);
    var id = book_info.id;
    var bid = book_info.bid;
    superagent.get(util.getBookMainUrl(id, bid), function (err, res) {
        let shop_tips = res.body.data.html_shop_tips;
        superagent.get(util.getShopHtmlUrl(id, bid), function (errShop, resShop) {
            let shopObj = JSON.parse(resShop.text);
            if (shopObj.data.html) {
                let shopDetail = {
                    phone: util.subString(shopObj.data.html, '<span>门店电话：</span>', '</p>'),
                    address: util.subString(shopObj.data.html, '<span>门店地址：</span>', '<a href='),
                    pickup_desc: util.subString(shop_tips, '<b>取车门店：</b><span data-role-id="store_address_pickup1">', '</span>'),
                    return_desc: util.subString(shop_tips, '<b>还车门店：</b><span data-role-id="store_address_pickup3">', '</span>'),
                    pickup_guide: util.subString(shopObj.data.html, '<h2 class="u-tit"><i class="icon i-location"></i>取车指引</h2>', '</ul>'),
                    return_guide: util.subString(shopObj.data.html, '<h2 class="u-tit"><i class="icon i-location"></i>还车指引</h2>', '</ul>'),
                    book_url: util.getBookUrl(id, bid)
                }
                util.save_shop(shop, shopDetail, cb);
            }
            else {
                logUtil.log(shop.id);
                logUtil.log(util.getBookUrl(id, bid))
                cb();
            }
        });

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

util.save_shop = function (item, shopObj, cb) {
    var list = [global_data.config.id, global_data.city_id, global_data.landmark_id, item.id, item.lat, item.lng, item.time_tip_sub, item.tips_sub, item.name, item.name, shopObj.phone, shopObj.address, shopObj.pickup_desc, shopObj.return_desc, shopObj.pickup_guide, shopObj.return_guide, shopObj.book_url];
    let sql = "INSERT INTO `hzc_monitor`.`reptile_zzc_shop` (`clid`,`city_id`,`zzc_place_id`, `zzc_shop_id`, `lat`, `lng`, `time_tip_sub`,`tips_sub`, `name`, `vendor_name`,`phone`,`address`,`pickup_desc`,`return_desc`,`pickup_guide`,`return_guide`,`book_url`) VALUES ?";

    mysql_connect.excute(sql, [list], global_data.db_config).then(function (result) {
        cb();
    });
}

util.get_shop_by = function (city_id, zzc_place_id, cb) {
    let sql = "SELECT * FROM hzc_monitor.reptile_zzc_shop where active=1 and city_id=" + city_id + " and zzc_place_id=" + zzc_place_id + ";";
    mysql_connect.query(sql, global_data.db_config).then(function (result) {
        cb(result.result);
    });
}

util.is_contain_by_db = function (arr, value) {
    if (value > 0) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].zzc_shop_id == value)
                return true;
        }
    }
    return false;
}

