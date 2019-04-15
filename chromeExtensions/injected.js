function modifyResponse(response) {

    var original_response, modified_response;

    original_response = response.target.responseText;
    if (this.readyState === 4) {
        // 使用在 openBypass 中保存的相关参数判断是否需要修改
        if (!window.config_inject && this.requestURL.indexOf("/list_new_json") > -1 && this.requestMethod) {
            Object.defineProperty(this, "responseText", { writable: true });
            modified_response = JSON.parse(original_response);
            // 根据 sendBypass 中保存的数据修改响应内容
            this.responseText = JSON.stringify(modified_response);
            if (modified_response && original_response.length > 1000) {
                window.getConfig();
                window.config_inject.zzcPackageCount = modified_response.data.info.current_car;
                console.log("发送消息");
                setTimeout(function() {
                    window.config_inject.zzcPackageCount = $("#PackageCountUp").text();
                    window.postMessage({ "request": { "url": this.requestURL, "data": this.requestData }, "response": modified_response, "config": window.config_inject }, '*');
                }, 1000 * 30);

            } else {
                console.log(original_response);
                if (modified_response && modified_response.data && modified_response.data.clid) {
                    window.pageConfig.id = modified_response.data.clid;
                }
            }

        }
    }
}

function openBypass(original_function) {

    return function(method, url, async) {
        // 保存请求相关参数
        this.requestMethod = method;
        this.requestURL = url;

        this.addEventListener("readystatechange", modifyResponse);
        return original_function.apply(this, arguments);
    };

}

function sendBypass(original_function) {
    return function(data) {
        // 保存请求相关参数
        this.requestData = data;
        return original_function.apply(this, arguments);
    };
}

XMLHttpRequest.prototype.open = openBypass(XMLHttpRequest.prototype.open);
XMLHttpRequest.prototype.send = sendBypass(XMLHttpRequest.prototype.send);

window.getConfig = function() {
    if (window.pageConfig) {
        console.log(window.pageConfig);
        var config = {};
        config.id = window.pageConfig.id;
        config.pickup = getPoiConfig(window.pageConfig.landmark.currentPickUp, 1);
        config.dropoff = getPoiConfig(window.pageConfig.landmark.currentDropOff, 2);


        config.pickup.code = getPoiCode(config.pickup, window.pageConfig.landmark.pickUp);
        config.dropoff.code = getPoiCode(config.dropoff, window.pageConfig.landmark.dropOff);

        config.pick_time = document.getElementById("from_date2").value + "T" + document.getElementById("from_time2").value;
        config.dropOff_time = document.getElementById("to_date2").value + "T" + document.getElementById("to_time2").value;
        console.log(JSON.stringify(config));
        config.pick_up_poi = window.pageConfig.landmark.pickUp;
        window.config_inject = config;
    }
}

function getPoiConfig(zzc_poi, type) {
    var result = {};
    result.airport = zzc_poi.airport;
    result.lat = zzc_poi.lat;
    result.lng = zzc_poi.lng;
    result.name = zzc_poi.name;
    result.name_en = zzc_poi.name_en;
    if (type == 1) {
        result.country = document.getElementById("pickup").getAttribute("region_name");
        result.city = document.getElementById("pickup").value;
    } else {
        result.country = document.getElementById("dropoff").getAttribute("region_name");
        result.city = document.getElementById("dropoff").value;
    }
    result.city = result.city.substr(0, result.city.indexOf("-")).trim();
    result.zzc_city_id = zzc_poi.cityId;

    return result;
}

function getPoiCode(cur_poi, list) {
    var name = cur_poi.name;
    for (var index in list) {
        var item = list[index];
        if (item.type == "airport") {
            for (var j in item.list) {
                var poi = item.list[j];
                if (poi.name == name) {
                    cur_poi.zzc_place_id = poi.id;
                    return poi.iata;
                }
            }
        }
    }
    return "";
}