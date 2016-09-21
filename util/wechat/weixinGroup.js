/**
 * Created by ZhangXiao on 2016/6/3.
 */
var urllib = require('urllib');
var extend = require('util')._extend;

var prefix = 'https://api.weixin.qq.com/';

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

exports.request = function (url, opts, accessToken, callback){
    url = prefix + url +"?access_token=" + accessToken;
    opts = postJSON(opts);
    var options = {};
    //extend(options, this.defaults);
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
