var browser = {
  versions: function () {
    var u = navigator.userAgent;
    var app = navigator.appVersion;
    return { //移动终端浏览器版本信息
      trident: u.indexOf('Trident') > -1, //IE内核
      presto: u.indexOf('Presto') > -1, //opera内核
      webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
      gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
      mobile: !!u.match(/AppleWebKit.*Mobile/i) || !!u.match(/MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/), //是否为移动终端
      ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
      android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
      iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
      iPad: u.indexOf('iPad') > -1, //是否iPad
      webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
    };
  }(),
  language: (navigator.browserLanguage || navigator.language).toLowerCase()
};
// if(browser.versions.iPhone || browser.versions.iPad || browser.versions.ios) { //苹果版
//   window.location.href = "https://itunes.apple.com/us/app/bei-jing-xin-xi-wang-huo-dong/id1097486612?mt=8";
//   is_weixn(); //苹果微信不自动跳转浏览器
// }
// if(browser.versions.android) { //安卓
//   window.location.href = "http://active.bjxxw.com/Appdown/active.apk";
// }
// 是否为微信
function is_weixin() {
  var ua = navigator.userAgent.toLowerCase();
  if(ua.match(/MicroMessenger/i) == "micromessenger") {
    return true;
  } else {
    return false;
  }
}