// 开发环境
//var debug = false;
//var appid = 'wx172b51436ce5f123';

//正式环境
var debug = false;
var appid = 'wx677de13bb5d47115';
//var domainUrl = "http://localhost:4000"; //域名
var domainUrl = "http://xcesys.com:4000"; //域名
var serverUrl = domainUrl + "";      	//服务端url
var baseUrl = serverUrl;
//var htmlUrl = "http://localhost" + "/m/";	//页面端url
var htmlUrl = "http://www.xcesys.com" + "/m/";	//页面端url

(function () {
    window['S'] = {};
    S['getQueryString'] = getQueryString;
    S['alert'] = debugAlert;
    S['locationURL'] = getLocationURL;

    function debugAlert(msg) {
        if (debug) {
            alert(msg);
        }
    }

    function getLocationURL() {
        return location.href.split('#')[0];
    }

    /**
     * 获取URL参数
     * @param name 要获取的参数名称
     * @returns {*}
     */
    function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = decodeURI(window.location.search).substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    }

})();