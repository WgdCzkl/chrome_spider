//日志工具类  Create By Xu Wei 2015/11/26

(function() {
    //依赖项
    var fs = require("fs"); //文件读写
    var moment = require("moment"); //日期时间处理

    //输出引用项
    var logUtil = {};

    logUtil.logPath = "log/";

    //日志记录
    logUtil.log = function(str, type, newFilePath) {
        logUtil.checkAndMkdir(logUtil.logPath);
        if (type)
            console.dir(type);
        console.dir(str);
        logUtil.logToFile(str, type, newFilePath);
        return logUtil;
    }


    //日志记入日志文件
    logUtil.logToFile = function(str, type, newFilePath) {
        var log = {};
        log.title = type == null ? "General" : type;
        log.Timestamp = moment(new Date()).format('YYYY-MM-DD  HH:mm:ss');
        log.Message = str;
        var date = moment(new Date()).format('YYYY-MM-DD');
        var fileName = "log" + date + ".log";
        var logFilePath = logUtil.logPath + fileName;

        var logstr = JSON.stringify(log, null, 4);

        fs.appendFile(logFilePath, "---------------------------------------------\r\n" + logstr + "\r\n", function(err) {
            if (err) {
                console.dir(err);
            }
        });

        //是否写入单独的文件
        if (newFilePath) {
            var newlogFileName = newFilePath + date + ".log";
            var newlogFilePath = logUtil.logPath + newlogFileName;
            fs.appendFile(newlogFilePath, "---------------------------------------------\r\n" + logstr + "\r\n", function(err) {
                if (err) {
                    console.dir(err);
                }
            });
        }
    }

    //生成文件夹
    logUtil.checkAndMkdir = function(path) {
        if (fs.existsSync(path)) {
            //log('已经创建过此目录:'+path);
        } else {
            let pathArray = path.split("/");
            let subPath = "";
            for (var i = 0, len = pathArray.length; i < len; i++) {
                subPath += pathArray[i] + "/";
                console.log(subPath);
                if (!fs.existsSync(subPath)) {
                    fs.mkdirSync(subPath);
                }
            }
            logUtil.log('目录已创建成功:' + path);
        }
    }


    module.exports.log = logUtil;

}());