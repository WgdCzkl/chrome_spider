const mysql = require('mysql');
const db_config = require('./db_config');
const logUtil = require("../logUtil").log; //日志封装

let mysql_connection = {};
module.exports = mysql_connection;

function create_connection(db) {
    if (!db) db = "_82";
    return mysql.createConnection(db_config[db]);
}

mysql_connection.query = function(sql, db) {
    let connection = create_connection(db);
    return new Promise(function(resolve) {
        connection.query(sql, function(error, results, fields) {
            //当查询完毕,结束连接,这种方式会立即断开连接,并不会有回调函数
            connection.destroy();
            resolve({ "err": error, "result": results, "fields": fields });
        });
    })
}

mysql_connection.query_with_param = function(sql, params, db) {
    let connection = create_connection(db);
    return new Promise(function(resolve) {
        connection.query(sql, params, function(error, results, fields) {
            //当查询完毕,结束连接,这种方式会立即断开连接,并不会有回调函数
            connection.destroy();
            resolve({ "err": error, "result": results, "fields": fields });
        });
    })
}

mysql_connection.excute = function(sql, values, db) {
    let connection = create_connection(db);
    return new Promise(function(resolve) {
        connection.query(sql, [values], function(err, rows, fields) {
            connection.destroy();
            resolve({ "err": err, "result": { "rows": rows, "fields": fields } });
        });
    });
}