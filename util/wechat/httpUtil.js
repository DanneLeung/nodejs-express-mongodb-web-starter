/**
 * Created by ZhangXiao on 2016/6/13.
 * http post request
 */
var crypto = require('crypto');
var urllib = require('urllib');
var extend = require('util')._extend;

/**
 * 获取加密sign
 * sign=MD5(account+MD5(pwd)+timestamp+mobiles)
 * @param data
 * @returns {*}
 */
exports.sign = function(data){
    //先加密密码
    var md5 = crypto.createHash('md5');
    md5.update(data.pwd);
    var pwdMd5 = md5.digest('hex');
    //获取加密sign
    var sign = data.account + pwdMd5 + data.timestamp + data.mobiles;
    md5 = crypto.createHash('md5');
    md5.update(sign);
    var sign = md5.digest('hex');
    return sign;
}

function postJSON (data) {
    return {
        dataType: 'json',
        type: 'POST',
        data: data,
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

exports.post = function(url, opts, callback){
    opts = postJSON(opts);
    var options = {};
    if (typeof opts === 'function') {
        callback = opts;
        opts = {};
    }
    for (var key in opts) {
        if (key !== 'headers') {
            options[key] = opts[key];
        } else {
            if (opts.headers) {
                options.headers = options.headers || {};
                extend(options.headers, opts.headers);
            }
        }
    }
    urllib.request(url, options, callback);
}

function getJSON (data) {
    return {
        dataType: 'json',
        type: 'GET',
        data: data,
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

exports.get = function(url, opts, callback){
    opts = getJSON(opts);
    var options = {};
    if (typeof opts === 'function') {
        callback = opts;
        opts = {};
    }
    for (var key in opts) {
        if (key !== 'headers') {
            options[key] = opts[key];
        } else {
            if (opts.headers) {
                options.headers = options.headers || {};
                extend(options.headers, opts.headers);
            }
        }
    }
    urllib.request(url, options, callback);
}