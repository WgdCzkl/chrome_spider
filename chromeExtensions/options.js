var global_data = {
    url: {
        zzc_car_list: 'https://w.zuzuche.com/list/',
        //api_domain: 'http://bl.huizuche.com:5003/',
        api_domain: 'http://localhost:5003/',
        spider: 'spider',
        get_city: 'get_city_data_from_api',
        get_landmarki: 'get_landmarki_data_from_api',
        get_wait_spide_landmarki: 'get_wait_spide_landmarki_data_from_api',
        init_city: 'init_city_data_from_api',
    },
    table: false,
    state: {
        spide_zzc_shop: false,
        auto_spide: false
    },
    city_data_list: [],
    landmarki_data_list: [],
    wait_spide_data_list: [],
};

$(function () {
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



    function cache_set_local(obj, log_msg) {
        chrome.storage.local.set(obj, function () {
            if (log_msg)
                console.log(log_msg);
        });
    }

    function cache_get_local(obj, log_msg) {
        chrome.storage.local.set(obj, function (data) {
            if (log_msg)
                console.log(log_msg);
        });
    }

    function cache_set(obj, log_msg) {
        chrome.storage.local.set(obj, function () {
            if (log_msg)
                console.log(log_msg);
        });
    }

    $("#btn_open").on("click", function () {
        $("#btn_close").show();
        $("#btn_open").hide();
        chrome.storage.sync.set({spide_zzc_shop: false}, function () {
            notify(false);
        });
    });

    $("#btn_close").on("click", function () {
        $("#btn_close").hide();
        global_data.state.spide_zzc_shop = true;
        chrome.storage.sync.set({spide_zzc_shop: true}, function () {
            init_table_data().then(function () {
                $("#btn_open").show();
            }).catch(function (err) {
                console.log(err);
            });
        });
    });
});

function get_landmarki_data_from_api(cb) {
    $.get(global_data.url.api_domain + global_data.url.get_landmarki, function (res) {
        global_data.landmarki_data_list = res.data;
        cb();
    }).fail(function () {
        alert(arguments[2]);
    });
}

function get_wait_spide_landmarki_from_api(city_id, cb) {
    $.get(global_data.url.api_domain + global_data.url.get_wait_spide_landmarki + '?city_id=' + city_id, function (res) {
        global_data.wait_spide_data_list = res.data;
        cb(global_data.wait_spide_data_list);
    }).fail(function () {
        alert(arguments[2]);
    });
}

function init_table_data() {
    return new Promise(function (resolve, reject) {
        console.log("init_table_data 105")
        console.log(new Date().Format("yyyy-MM-dd hh:mm:ss"))
        get_city_data().then(function (res) {
            if (global_data.table) {
                global_data.table.bootstrapTable('refreshOptions', {data: global_data.city_data_list});
            } else {
                console.log("init_table_data 109")
                console.log(new Date().Format("yyyy-MM-dd hh:mm:ss"))
                global_data.table = $('#table').bootstrapTable({data: global_data.city_data_list});
            }
            resolve();
        })
    });
}

function get_city_data() {
    return new Promise(function (resolve, reject) {
        get_city_data_from_api().then(function (result) {
            if (result.length < 1) {
                init_city_data_from_api().then(function () {
                    console.log('init_city_data_from_api Complete');
                    get_city_data_from_api().then(function () {
                        resolve();
                    });
                }).catch(function (err) {
                    console.log(err)
                });
            }
            else {
                resolve();
            }
        }).catch(function (err) {

        });
    });
}

function init_city_data_from_api() {
    return new Promise(function (resolve, reject) {
        $.get(global_data.url.api_domain + global_data.url.init_city, function (res) {
            resolve(res);
        }).fail(function () {
            reject(arguments[2]);
        });
    });
}


function get_city_data_from_api() {
    return new Promise(function (resolve, reject) {
        $.get(global_data.url.api_domain + global_data.url.get_city, function (res) {
            global_data.city_data_list = res.data;
            resolve(res.data);
        }).catch(function () {
            reject(arguments[2]);
        });
    });
}

function get_one_no_spide(city_id, cb) {
    if (global_data.state.auto_spide) {

    }
    else {
        get_wait_spide_landmarki_from_api(city_id, function (list) {
            global_data.wait_spide_data_list = list;
            let item = getone_no_spide_by(list);
            cb(item);
        })
    }
}

function getone_no_spide_by(list) {
    for (var i = 0, len = list.length; i < len; i++) {
        var item = list[i];
        if (!item.spide_time) {
            return item;
        }
    }
}

function auto_spider(config) {
    init_table_data().then(function () {
        if (global_data.state.spide_zzc_shop) {
            console.log(new Date().Format("yyyy-MM-dd hh:mm:ss"))
            get_one_no_spide(config.pickup.zzc_city_id, function (cur_item) {
                console.log(new Date().Format("yyyy-MM-dd hh:mm:ss"))
                if (!cur_item) {
                    console.log("已经爬取完成");
                    return;
                }
                spider(config, cur_item.landmark_id)
            });
        }
    })
}

function spider(config, landmark_id) {
    var url = getUrlByLandmarkId(config, landmark_id);
    chrome.tabs.query({"url": ["*://w.zuzuche.com/*", "*://www.zuzuche.com/*"]}, function (result) {
        var _id = result ? result[0].id : 1;
        chrome.tabs.update(_id, {
            "url": url
        });
    });

}

function getUrlByLandmarkId(config, landmark_id) {
    let city_id = config.pickup.zzc_city_id;
    var url = "http://w.zuzuche.com/list.php?force_refresh=1&pickup_city=" + city_id +
        "&pickup_landmark=" + landmark_id +
        "&dropoff_city=" + city_id +
        "&dropoff_landmark=" + landmark_id +
        "&from_date_0=" + config.pick_time.split("T")[0] +
        "&from_date_1=" + encodeURIComponent(config.pick_time.split("T")[1]) +
        "&to_date_0=" + config.dropOff_time.split("T")[0] +
        "&to_date_1=" + encodeURIComponent(config.dropOff_time.split("T")[1]);
    return url;
}

function actionFormatter(row) {
    return [
        '<button class="reptile" type="button" class="btn btn_open  btn-primary btn-lg" title="爬取">爬取</button>',
        //'<button class="remove"  type="button" class="btn btn_open  btn-primary btn-lg"  title="移除">移除</button>',
    ].join('&nbsp;');
}

function notification_msg(msg) {
    chrome.notifications.create("", {
        "type": "basic",
        "iconUrl": "./images/get_started32.png",
        "title": "租租车供应商门店爬取通知",
        "message": msg
    });
}

// delete events
window.actionEvents = {
    'click .remove': function (e, value, row) {
        if (confirm('确认移除这条记录吗?')) {

        }
    },
    'click .reptile': function (e, value, row) {
        if (confirm('确认爬取这条记录吗?')) {
            window.open(global_data.url.zzc_car_list + row.region_id + '/' + row.city_id + '/1')
        }
    }
};

chrome.runtime.onMessage.addListener(function (res) {
    console.log("后台接收到消息");
    var message = res["message"];
    if (global_data.state.spide_zzc_shop && message && message.id > 0) {
        console.log("开始爬取");
        notification_msg("开始爬取" + message.pickup.country + message.pickup.city + message.pickup.code);
        console.log(new Date().Format("yyyy-MM-dd hh:mm:ss"))
        $.ajax({
            "type": "post",
            "contentType": "application/json",
            "dataType": "json",
            "url": global_data.url.api_domain + global_data.url.spider,
            "data": JSON.stringify(message),
            "success": function (data) {
                console.log("爬取成功1");
                notification_msg(data.success ? ("爬取成功" + message.pickup.country + message.pickup.city + message.pickup.code) : (data.msg && data.msg.message ? ("失败:" + data.msg.message) : "接口请求失败"));
            },
            "error": function (data) {
                console.log("异常");
            },
            "complete": function (data) {
                console.log(new Date().Format("yyyy-MM-dd hh:mm:ss"))
                console.log('auto_spider')
                auto_spider(message);
            }
        });
    }
});