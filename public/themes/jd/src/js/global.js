var tmpUrl = "./template/";
var article_img = "/upload/article_img/"

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

function _getCityName() {
  if (window.localStorage) {
    if (localStorage["cityName"])
      return localStorage["cityName"];
    else
      return null;
  } else {
    "上海";
  }
}

function _getCityId() {
  if (window.localStorage) {
    if (localStorage["cityId"])
      return localStorage["cityId"];
    else
      return null;
  } else {
    "3";
  }
}


function is_weixn() {
  var ua = navigator.userAgent.toLowerCase();
  //S.alert(ua);
  if (ua.match(/micromessenger/i) == "micromessenger") {
    return true;
  } else {
    return false;
  }
}

// 非微信浏览器
function nwx() {
  if (!is_weixn()) {
    //$indexHeaderLeft = $(".indexHeader-left");
    //$indexHeaderLeft[0].className = "indexHeader-left-nwx";
    //$indexHeaderLeft.bind("click", function(){
    //	history.go(-1);
    //});
    $("#banner-header-right-share").css("display", "none");
  } else {
    $("#banner-header-right-share").bind("click", function () {
      $("#brand-detail-guide").toggleClass("hide");
      $("#brand-detail-guide").bind("click", function () {
        $("#brand-detail-guide").addClass("hide");
      }, false)
    }, false);
  }
}

var getStrSize = function (str) {
  var realLength = 0, len = str.length, charCode = -1;
  for (var i = 0; i < len; i++) {
    charCode = str.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128) realLength += 1;
    else realLength += 2;
  }
  return realLength;
};

function showShare() {
  $("#brand-detail-guide").toggleClass("hide");
  $("#brand-detail-guide").bind("click", function () {
    $("#brand-detail-guide").addClass("hide");
  }, false)
}

function closeShare() {
  $("#brand-detail-guide").addClass("hide");
}

function _getUserId() {
  if (window.localStorage) {
    if (localStorage["user.openid"])
      return localStorage["user.openid"];
    else
      return null;
  } else {
    return null;
  }
}

function blank(s) {
  return s == null ? "" : s;
}

// Date.prototype.format = function (format) {
//     var o = {
//         "M+": this.getMonth() + 1, //month
//         "d+": this.getDate(), //day
//         "h+": this.getHours(), //hour
//         "m+": this.getMinutes(), //minute
//         "s+": this.getSeconds(), //second
//         "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
//         "S": this.getMilliseconds() //millisecond
//     }

//     if (/(y+)/.test(format)) {
//         format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
//     }

//     for (var k in o) {
//         if (new RegExp("(" + k + ")").test(format)) {
//             format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
//         }
//     }
//     return format;
// }
