  chrome.runtime.onInstalled.addListener(function() {
      chrome.storage.sync.set({ color: '#3aa757' }, function() {
          console.log('The color is green.');
      });
      /*chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
          chrome.declarativeContent.onPageChanged.addRules([{
              conditions: [new chrome.declarativeContent.PageStateMatcher({
                  pageUrl: { hostEquals: 'w.zuzuche.com' },
              })],
              actions: [new chrome.declarativeContent.ShowPageAction()]
          }]);
      });*/
  });


  /*var callback = function(detail) {
      console.log(detail);
  };
  var filter = {
      urls: ["*://*.zuzuche.com/*"]
  };
  var opt_extraInfoSpec = ["blocking"];
 chrome.webRequest.onCompleted.addListener(
      callback, filter, opt_extraInfoSpec);

  chrome.webRequest.onCompleted.addListener(
      callback, filter, ["responseHeaders"]);

*/

  // Update the declarative rules on install or upgrade.
  chrome.runtime.onInstalled.addListener(function() {
      chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
          chrome.declarativeContent.onPageChanged.addRules([{
              conditions: [
                  new chrome.declarativeContent.PageStateMatcher({
                      pageUrl: { hostContains: 'zuzuche.com', pathContains: "list.php" }
                  })
              ],
              actions: [new chrome.declarativeContent.ShowPageAction()]
          }]);
      });
  });

  get_spide_switch(function(status) {
      chrome.contextMenus.create({
          id: "spide_zzc_carlist_switch",
          title: (status ? "关闭" : "开启") + "租租车Carlist爬取插件",
          onclick: function() {
              chrome.storage.sync.get("spide_zzc_carlist", function(data) {
                  console.log("获取开关状态：");
                  console.log(data);
                  if (data) {
                      change_spide_zzc_carlist(!data.spide_zzc_carlist);
                  }
              });
          }
      });
  });

  function update_context_menue_text(status) {
      chrome.contextMenus.update("spide_zzc_carlist_switch", {
          title: (status ? "关闭" : "开启") + "租租车Carlist爬取插件"
      });
      chrome.runtime.sendMessage({ "type": "spide_zzc_carlist_switch", "data": status });
  }


  function get_spide_switch(callback) {
      chrome.storage.sync.get("spide_zzc_carlist", function(data) {
          if (data) {
              console.log("获取开关状态：" + data.spide_zzc_carlist);
              callback && callback(data.spide_zzc_carlist);
          }
      });
  }

  function change_spide_zzc_carlist(status) {
      console.log("切换状态：" + status);
      chrome.storage.sync.set({ spide_zzc_carlist: status }, function() {
          update_context_menue_text(status);
          chrome.notifications.create("", { "type": "basic", "iconUrl": "./images/get_started32.png", "title": "租租车车辆列表爬取插件通知", "message": status ? "已开启" : "已关闭" });
      });
  }


  /* pageAction 没有badage
  chrome.browserAction.setBadgeText({ text: '爬虫' });
  chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
  */

  chrome.pageAction.onClicked.addListener(function(tab) {
      console.log(tab);
      chrome.tabs.create({ "url": "./options.html" });
  });