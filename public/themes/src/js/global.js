function getQueryString(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  var r = decodeURI(window.location.search).substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

/**
 * 删除URL中指定名字的query string。
 * @param names 名字数组
 */
function removeQueryString(url, names) {
  if (names && url && url.indexOf('?') >= 0) {
    var s = url.substr(0, url.indexOf('?'));
    var q = url.substr(url.indexOf('?') + 1);
    console.log("s: %s, q: %s", s, q);
    if (q) {
      var array = q.split('&');
      console.log("array ", array);
      if (array) {
        var newQs = '';
        for (var i = 0; i < array.length; i++) {
          var qs = array[i];
          qs = qs.indexOf('=') >= 0 ? qs.substr(0, qs.indexOf('=')) : qs;
          if (!inarray(qs, names)) {
            newQs += "&" + array[i];
          }
        }
        if (newQs.length > 0) {
          //s += '?' + (newQs.startsWith('&') ? newQs.substr(1) : newQs);
          s += '?' + (newQs.indexOf('&') == 0 ? newQs.substr(1) : newQs);
          s += '&_' + Date.now();
        } else {
          s += '?_' + Date.now();
        }
        url = s;
      }
    }
  }
  return url;
}


function getLocationURL() {
  return location.href.split('#')[0];
}
/**
 * 获取当前位置，从浏览器或者微信定位
 * @param cb
 */
function getLocation(cb) {
  //打开一次浏览器重新获取一次地址
  var geolocation = sessionStorage.geolocation;
  if (geolocation) {
    cb(geolocation.split(','));
    return;
  }
  //从url中获取坐标(通过微信端发送位置,回复的图文消息中传递的坐标)
  if (getQueryString("lat") && getQueryString("lng")) {
    var lat = getQueryString("lat");
    var lng = getQueryString("lng");
    var geolocation = [lng, lat];
    sessionStorage.setItem("geolocation", geolocation);
    cb(geolocation);
    return;
  }

  //geolocation = [121.473701, 31.230416];
  //获取当前位置坐标
  if (is_weixn()) {
    //通过微信地图定位,取得gps坐标
    W.location(function (lat, lng) {
      var geolocation = [lng, lat];
      sessionStorage.setItem("geolocation", geolocation);
      cb(geolocation);
    });
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (p) {
        var latitude = p.coords.latitude; //纬度
        var longitude = p.coords.longitude;
        console.log("经纬度" + (longitude + "," + latitude));
        geolocation = [longitude, latitude];
        sessionStorage.geolocation = geolocation;
        cb(geolocation);
      }, function (e) {
        sessionStorage.geolocation = geolocation;
        cb(geolocation);
      });
    } else {
      //cb([121.473701, 31.230416]);
      alert("浏览器不支持定位功能!");
    }
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

function blank(s) {
  return s == null ? "" : s;
}

//console.log(removeQueryString('http://xcesys.com/n/?cid=ccb&code=ieijoc23ldiodo&state=base', ['code', 'state']));
