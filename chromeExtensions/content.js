var s = document.createElement("script");
s.src = chrome.extension.getURL("injected.js");
s.onload = function() {
    console.log("加载成功")
};
(document.head || document.documentElement).appendChild(s);


window.addEventListener("message", function(e) {
    //console.log(e.data);
    //var cars = e.data.response && constructResponse(e.data.response.data, e.data.config);
    //postDataToServer(cars);
    //chrome.tabs.create({ "url": "http://w.zuzuche.com/list.php?force_refresh=1&new=1&pickup_city=3359&pickup_landmark=&dropoff_city=3359&dropoff_landmark=&from_date_0=2018-10-29&from_date_1=13%3A30&to_date_0=2018-10-31&to_date_1=20%3A00" });
    chrome.runtime.sendMessage({ "message": e.data.config });
}, false);

function postDataToServer(cars) {
    console.log("开始提交");
    //console.log(JSON.stringify(cars));
    /*Jquery.ajax({
        url: "http://172.16.102.81:12306/drv-monitor-api/v1/reptile/reptileHzcAndZzc",
        data: cars,
        type: "POST",
        success: function(data) {
            console.log("data saved successfully");
        }
    });*/
}