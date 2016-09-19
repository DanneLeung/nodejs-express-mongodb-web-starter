/**
 * Created by danne on 2016-05-06.
 */
$(function () {
  if (is_weixn()) {
    W.oauthUser(authAppid, function (user) {
      W.configWx(authAppid);
      var openid = user.openid;
      var unionid = user.unionid;
      var identifyNo = $("#identifyNo").val();
      if(identifyNo && unionid){
        $.ajax({
          url: $("#path").val()+'share/wechat/fans',
          type: 'post',
          data: {"openid": openid, "identifyNo": identifyNo, "unionid": unionid},
          success: function(data){

          }
        })
      }

      var getHost = function(url) {
        var host = "null";
        if(typeof url == "undefined"
            || null == url)
          url = window.location.href;
        var regex = /.*\:\/\/([^\/]*).*/;
        var match = url.match(regex);
        if(typeof match != "undefined"
            && null != match)
          host = match[1];
        return host;
      }

      var setting = {};
      setting.title = $("#title").val();
      setting.desc = $("#desc").val();
      setting.logoPath = "http://"+ getHost() +$("#logoPath").val();
      menuShareAppMessage(setting);
      menuShareTimeline(setting);
    });
  }
});

/**
 * 分享给朋友
 */
function menuShareAppMessage(setting){
  wx.ready(function () {
    wx.onMenuShareAppMessage({
      title: setting.title, // 分享标题
      desc: setting.desc,//setting.desc, // 分享描述
      link: window.location.href, // 分享链接
      imgUrl: setting.logoPath, // 分享图标
      type: 'link', // 分享类型,music、video或link，不填默认为link
      dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
      success: function () {
        // 用户确认分享后执行的回调函数
      },
      cancel: function () {
        // 用户取消分享后执行的回调函数
      }
    });
  });
}

/**
 * 分享到朋友圈
 * @param setting
 */
function menuShareTimeline(setting){
  wx.ready(function () {
    wx.onMenuShareTimeline({
      title: setting.title, // 分享标题
      link: window.location.href, // 分享链接
      imgUrl: setting.logoPath, // 分享图标
      success: function () {
        // 用户确认分享后执行的回调函数
      },
      cancel: function () {
        // 用户取消分享后执行的回调函数
      }
    });
  });
}

