const logUtil = require("../logUtil").log; //日志封装
const superagent = require('superagent'); //客户端请求代理模块
const api_config = require('./config'); //数据配置相关

let util = {};
module.exports = util;

util.save_zzc_list = function(data, callback) {
    logUtil.log("开始存储");
    logUtil.log(data);
    superagent.post(api_config.save_zzc_list_url)
        .send(data)
        .set('Accept', 'application/json')
        .end(function(err, result) {
            if (err) {
                logUtil.log("save_zzc_list 异常")
                logUtil.log(err);
            }
            callback && callback(err, result.body);
        });
}