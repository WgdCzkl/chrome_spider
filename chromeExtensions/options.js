const kButtonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];
var spide_carlist_switch = false;
var api_domain = "http://localhost:5000/";

function constructOptions(kButtonColors) {
    for (let item of kButtonColors) {
        let button = document.createElement('button');
        button.style.backgroundColor = item;
        button.addEventListener('click', function() {
            chrome.storage.sync.set({ color: item }, function() {
                console.log('color is ' + item);
            })
        });
        // page.appendChild(button);
        var page = document.getElementById('buttonDiv');
        page.appendChild(button);
    }
}

function check_switch() {
    chrome.storage.sync.get("spide_zzc_carlist", function(data) {
        if (data.spide_zzc_carlist) {
            $("#btn_open").show();
            $("#btn_close").hide();
            notify(data.spide_zzc_carlist);
        } else {
            $("#btn_open").hide();
            $("#btn_close").show();
        }
        spide_carlist_switch = data.spide_zzc_carlist;
    });
}

function notify(status) {
    //chrome.runtime.sendMessage({ "type": "spide_carlist_switch", "status": status });
    spide_carlist_switch = status;
}

var poi_data_list;
var auto_spide = false;
var auto_save = false;
var $table;
$(function() {
    check_switch();

    chrome.storage.sync.get("auto_spide", function(data) {
        auto_spide = data && data.auto_spide;
        auto_spide && $("#check_auto_spide").attr("checked", true);
    });
    chrome.storage.sync.get("auto_save", function(data) {
        auto_spide = data && data.auto_save;
        auto_spide && $("#check_auto_save").attr("checked", true);
    });
    chrome.storage.sync.get("env_config", function(data) {
        if (data && data.env_config) {
            $('#input_env').val(data.env_config);
        }
        set_env_config($('#input_env').val());
    });
    //constructOptions(kButtonColors);
    $("#btn_open").on("click", function() {
        $("#btn_close").show();
        $("#btn_open").hide();
        chrome.storage.sync.set({ spide_zzc_carlist: false }, function() {
            console.log('spide_zzc_carlist:false');
            notify(false);
        });
    });

    $("#btn_close").on("click", function() {
        $("#btn_open").show();
        $("#btn_close").hide();
        chrome.storage.sync.set({ spide_zzc_carlist: true }, function() {
            console.log('spide_zzc_carlist:true');
            notify(true);
        });
    });

    $("#btn_clear").on("click", function() {
        count = 0;
        cache_poi_data_list(null);
        get_poi_data_from_api();
    });

    $("#input_env").on("change", function() {
        set_env_config($('#input_env').val());
    });

    $("#check_auto_spide").on("click", function() {
        if ($(this)[0] && $(this)[0].checked) {
            auto_spide = true;
        } else {
            auto_spide = false;
        }
        set_auto_spide(auto_spide);
        chrome.notifications.create("", { "type": "basic", "iconUrl": "./images/get_started32.png", "title": "租租车车辆列表爬取插件通知", "message": auto_spide ? "自动爬取已开启" : "自动爬取已关闭" });
    });

    $("#check_auto_save").on("click", function() {
        if ($(this)[0] && $(this)[0].checked) {
            auto_save = true;
        } else {
            auto_save = false;
        }
        set_auto_save(auto_spide);
        chrome.notifications.create("", { "type": "basic", "iconUrl": "./images/get_started32.png", "title": "租租车车辆列表爬取插件通知", "message": auto_save ? "自动补充三字码已开启" : "自动补充三字码已关闭" });
    });

    function set_env_config(val) {
        api_domain = val;
        chrome.storage.sync.set({ env_config: val }, function() {
            console.log('env_config:' + val);

        });
    }

    function set_auto_spide(stauts) {
        chrome.storage.sync.set({ auto_spide: stauts }, function() {
            console.log('auto_spide:' + stauts);
        });
    }

    function set_auto_save(stauts) {
        chrome.storage.sync.set({ auto_save: stauts }, function() {
            console.log('auto_save:' + stauts);
        });
    }



    get_poi_data();

    function get_poi_data() {
        chrome.storage.local.get("poi_data_list", function(data) {
            if (!data || !data.poi_data_list) {
                get_poi_data_from_api();
            } else {
                poi_data_list = data.poi_data_list;
                console.log(poi_data_list);
                init_data();
            }
        });

    }

    function get_poi_data_from_api() {
        $.get(api_domain + "poi_list.json", function(data) {
            console.log(data);
            poi_data_list = data.data;

            init_data();
            cache_poi_data_list(poi_data_list);
        }).fail(function() {
            alert(arguments[2]);
        });
    }
});

function actionFormatter(value) {
    return [
        '<a class="remove" href="javascript:" title="移除">移除</a>'
    ].join('');
}

// delete events
window.actionEvents = {
    'click .remove': function(e, value, row) {
        if (confirm('确认移除这条记录吗?')) {
            remove_item(row);
            init_data();
        }
    }
};

window.remove_item = function(row) {
    for (var i = 0, len = poi_data_list.length; i < len; i++) {
        var item = poi_data_list[i];
        console.log(item);
        if (item.place_id === row.place_id) {
            poi_data_list.splice(i, 1);
            return;
        }
    }
}

function cache_poi_data_list(list) {
    chrome.storage.local.set({ poi_data_list: list }, function() {
        console.log('poi_data_list set');
    });
}

function init_data() {
    if ($table) {
        $table.bootstrapTable('refreshOptions', { data: poi_data_list });
        cache_poi_data_list(poi_data_list);
    } else {
        $table = $('#table').bootstrapTable({ data: poi_data_list });
    }

}

function refresh_data(config) {
    var place_code = config.pickup.code;
    console.log("准备更新表格：" + place_code);
    var is_hit = false;
    for (var i = 0, len = poi_data_list.length; i < len; i++) {
        var item = poi_data_list[i];
        if (item.place_id === place_code) {
            item.spide_time = new Date().toLocaleString();
            item.is_spide = "是";
            is_hit = true;
        }
    }
    if (!is_hit && place_code && auto_save) {
        var new_item = {};
        new_item.country_name = config.pickup.country;
        new_item.city_name = config.pickup.city;
        new_item.place_id = config.pickup.code;
        new_item.is_airport = config.pickup.airport;
        new_item.place_type = 1;
        new_item.zzc_city_id = config.pickup.zzc_city_id;
        new_item.zzc_place_id = config.pickup.zzc_place_id;
        new_item.is_spide = "是";
        new_item.spide_time = new Date().toLocaleString();
        poi_data_list.push(new_item);
        save_to_config(new_item);
    }
    console.log("更新表格：" + place_code);
    init_data();
}

function save_to_config(item) {
    $.ajax({
        "type": "post",
        "contentType": "application/json",
        "dataType": "json",
        "url": api_domain + "save_to_spide_config",
        "data": JSON.stringify(item),
        "success": function(data) {
            console.log(data);
        },
        "error": function(data) {
            console.log("异常");
            console.log(data);
        }
    });
}

function auto_spider(config) {
    console.log("开始爬取");
    refresh_data(config);
    if (spide_carlist_switch && auto_spide) {
        var cur_item = get_one_no_spide();
        if (!cur_item) { console.log("已经爬取完成"); return; }

        var url = "http://w.zuzuche.com/list.php?force_refresh=1&new=1&pickup_city=" + cur_item.zzc_city_id +
            "&pickup_landmark=" + cur_item.zzc_place_id +
            "&dropoff_city=" + cur_item.zzc_city_id +
            "&dropoff_landmark=" + cur_item.zzc_place_id +
            "&from_date_0=" + config.pick_time.split("T")[0] +
            "&from_date_1=" + encodeURIComponent(config.pick_time.split("T")[1]) +
            "&to_date_0=" + config.dropOff_time.split("T")[0] +
            "&to_date_1=" + encodeURIComponent(config.dropOff_time.split("T")[1]);
        chrome.tabs.query({ "url": ["*://w.zuzuche.com/*", "*://www.zuzuche.com/*"] }, function(result) {
            console.log(result[0]);
            var _id = result ? result[0].id : 1;
            chrome.tabs.update(_id, {
                "url": url
            });
        });

    }
}

function get_one_no_spide() {
    for (var i = 0, len = poi_data_list.length; i < len; i++) {
        var item = poi_data_list[i];
        if (!item.is_spide) {
            return item;
        }
    }
}


var count = 0;
chrome.runtime.onMessage.addListener(function(data) {
    console.log("后台接收到消息");
    console.log(data);

    if (data && data.type == "spide_zzc_carlist_switch") {
        check_switch(data.data);
    }

    var message = data["message"];

    if (spide_carlist_switch && message && message.id > 0) {
        console.log(message);
        chrome.notifications.create("", { "type": "basic", "iconUrl": "./images/get_started32.png", "title": "租租车车辆列表爬取通知", "message": "开始爬取" + message.pickup.country + message.pickup.city + message.pickup.code });
        $.ajax({
            "type": "post",
            "contentType": "application/json",
            "dataType": "json",
            "url": api_domain + "/spider",
            "data": JSON.stringify(message),
            "success": function(data) {
                console.log(data);
                var msg = data.success ? ("爬取成功" + message.pickup.country + message.pickup.city + message.pickup.code) : (data.msg && data.msg.message ? ("失败:" + data.msg.message) : "接口请求失败");
                chrome.notifications.create("", { "type": "basic", "iconUrl": "./images/get_started32.png", "title": "租租车车辆列表爬取通知", "message": msg });
                auto_spider(message);
            },
            "error": function(data) {
                console.log("异常");
                console.log(data);
            }
        });
    }
});