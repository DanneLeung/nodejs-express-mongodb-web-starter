/**
 * 微信JS
 * 依赖于global.js 和 zepto.js/jquery.js
 */
var weixinOauthURL = 'https://open.weixin.qq.com/connect/oauth2/authorize';
var getUserInfoOauthURL = contextRoot + '/api/getUserInfo';
var signatureUrl = contextRoot + '/api/jsConfig';
var userListUrl = contextRoot + '/api/userList';
var userUrl = contextRoot + '/api/getUser';
var userByUioinIdUrl = contextRoot + '/api/getUserByUnionId';
var getLatestTokenUrl = contextRoot + '/api/getLatestToken';
var saveUploadImgUrl = contextRoot + '/api/saveUploadImg';
var shortUrl = contextRoot + '/api/getShortUrl';

(function () {
  /**********************************************
   *全名空间
   *定义外部可访问的方法名
   * *********************************************
   */
  var W = {
    clear: clear,
    config: config,
    getUser: getUser,
    oauthUser: oauthUser,
    oauthQuiet: oauthQuiet,
    weixinShare: weixinShare,
    location: getLocation,
    openLocation: openLocation,
    saveUploadImg: saveUploadImg,
    chooseImage: chooseImage,
    previewImage: previewImage,
    uploadImage: uploadImage,
    scanQRCode: scanQRCode,
    getShortUrl: getShortUrl

  };
  window.W = W;
  /*****************************End 全名空间******************/

  /**
   * 微信config
   * 在要使用JSSDK之前应先调用些方法
   * 且使用JSSDK方法应在具体页面内的wx.ready()方法内使用
   */
  function config(appid) {
    $.post(signatureUrl, { url: getLocationURL(), 'appid': appid }, function (data, status, xhr) {
      if(status && status == 'success' && data) {
        console.log('********* config data:' + JSON.stringify(data));
        wx.config(data);
      } else {
        console.log('wx config error ', data, status, xhr);
      }
    });
  }

  /**
   * 以scope=snsapi_userinfo请求微信用户网页授权
   * @param redirectUri
   */
  function oauthUserInfo(appid, redirectUri) {
    oauth(appid, 'snsapi_userinfo', redirectUri, 'userinfo');
  }

  /**
   * 以scope=snsapi_base请求授权
   * 静默状态，没有用户确认授权页面
   * @param redirectUri
   */
  function oauthUserBase(appid, redirectUri) {
    oauth(appid, 'snsapi_base', redirectUri, 'base');
  }

  /**
   * 发起授权请求
   * @param scope
   * @param redirectUri
   */
  function oauth(appid, scope, redirectUri, state) {
    var redirectURL = encodeURIComponent('http://9cubic.cn/wxroute/' + redirectUri.replace('https://', '').replace('http://', ''));
    // var redirectURL = encodeURIComponent(redirectUri);
    //var redirectURL = encodeURIComponent(redirectUri);
    var oauthURL = weixinOauthURL;
    oauthURL += '?appid=' + appid;
    oauthURL += '&redirect_uri=' + (redirectURL);
    oauthURL += '&response_type=code';
    oauthURL += '&scope=' + scope;
    oauthURL += '&state=' + state;
    oauthURL += '#wechat_redirect';
    //console.log(oauthURL);
    window.location.href = oauthURL;
  }

  /**
   * 静默用户认证,只获取用户openid
   */
  function oauthQuiet(appid, callback) {
    var redirectUri = getLocationURL();
    //var openid = null;
    var state = getQueryString('state'); //通过state区分是base还是userinfo请求 alert('state: ' + state);
    var code = getQueryString('code');
    var openid = localStorage.getItem(appid + '.user.openid');
    var unionid = localStorage.getItem(appid + '.user.unionid');
    var user = localStorage.getItem(appid + '.user');

    if(!openid || openid == 'undefined') { //console.log('本地无用户信息');
      if(!code || code == 'undefined') { //console.log('向微信发起授权请求');
        /*
         * 先靜默方式找用户信息
         */
        oauthUserBase(appid, redirectUri);
      } else {
        if(state == 'base') {
          //console.log('静默回调');
          getUserInfoOauth(appid, callback); //静默获取open
        }
      }
    } else { //console.log('获取到本地用户信息');
      console.log('获取到本地用户信息');
      callback();
      return true;
    }
  }

  /**
   * 页面认证用户信息
   * 1.优先从本地存储中获取用户信息(以openId是否存在为依据)
   * 2.如果本地没有openId则优先以静默方式请求用户信息(用户自己清空本地缓存的情况)
   * 3.以上都没有，则要求用户进行微信网页授权流程,授权后返回当前页面
   *
   * @param callback
   * 用户信息认证后的回调函数，为保证ajax请求同步， 请在回调函数内使用localStorage取用户信息,
   * 多数情况下没问题，但在用户第一次授权时如果不在回调内访问localStorage 可能存在取不到值的情况
   */
  function oauthUser(appid, callback) {
    var redirectUri = getLocationURL();
    //var openid = null;
    var state = getQueryString('state'); //通过state区分是base还是userinfo请求 alert('state: ' + state);
    var code = getQueryString('code');

    //console.log('执行微信权限认证');
    var openid = localStorage.getItem(appid + '.user.openid');
    var unionid = localStorage.getItem(appid + '.user.unionid');
    var user = localStorage.getItem(appid + '.user');
    // 第一次进入,浏览器本地无openid,执行base认证获取openid
    if((!openid || openid == 'undefined') && (!unionid || unionid == 'undefined')) {
      if(!code) {
        // console.log('向微信发起网页授权请求1111');
        /*先靜默方式找用户信息，
         *如果静默方式找不到则要求用户授权
         */
        oauthUserInfo(appid, redirectUri);
      } else if(state) {
        getUserInfoOauth(appid, function (user) {
          // 重定向到没有code和state的url
          console.log('&&&&&&&&&&&&& user: ', JSON.stringify(user));
          //callback(user);
          //if (!user) {
          //}
          //alert("******* getUserInfoOauth " + JSON.stringify(user));
          window.location.href = removeQueryString(redirectUri, ['code', 'state']);
        });
      }
    } else if(user && openid && openid != '' && openid != 'null') { //console.log('获取到本地用户信息');
      console.log('获取到本地用户信息'); //console.log('获取到本地用户信息');
      return callback(user ? JSON.parse(user) : {});
    } else if(openid && openid != '' && openid != 'null') {
      return getUserAndSave(appid, openid, callback);
    } else if(unionid) {
      return getUserByUnionId(appid, unionid, callback);
    }
    // callback();
  }

  function getUser(appid) {
    var user = localStorage.getItem(appid + '.user');
    return user ? JSON.parse(user) : null;
  }
  /**
   * 用户授权公开信息后，通过微信返回code从服务端请求用户信息
   * @param callback
   */
  function getUserInfoOauth(appid, callback) {
    var code = getQueryString('code');
    var scope = 'snsapi_' + getQueryString('state');
    //console.log(code);
    /***/
    $.post(getUserInfoOauthURL, { 'appid': appid, 'code': code, 'scope': scope, 'appid': appid }, function (data) {
      if(data && data.error == '0' && data.result) {
        callback(userInfoLocalStorage(appid, data.result));
        //callback在ajax返回后且设置localStorage之后执行，以保存在回调中能拿取到信息
      } else {
        console.log('获取微信用户信息错误');
        // callback({openid: localStorage.getItem('user.openid'), nickname: '', headimgurl: ''});
        callback(null);
      }
    });
  }

  function getUserAndSave(appid, openid, callback) {
    $.post(userUrl, { 'openid': openid }, function (user) {
      callback(userInfoLocalStorage(appid, user));
    });
  }

  function getUserByUnionId(appid, unionid, callback) {
    $.post(userByUioinIdUrl, { appid: appid, unionid: unionid }, function (user) {
      callback(userInfoLocalStorage(appid, user));
    });
  }

  function userInfoLocalStorage(appid, user) {
    if(!user)
      return user;
    //localStorage.setItem(appid + '.user.openid', (user.hasOwnProperty('openid') ? user.openid : null));
    //localStorage.setItem(appid + '.user.unionid', (user.hasOwnProperty('unionid') ? user.unionid : null));
    localStorage.setItem(appid + '.user.openid', user.openid);
    localStorage.setItem(appid + '.user.unionid', user.unionid);
    var user = {
      openid: user.openid,
      nickname: user.nickname,
      username: user.username,
      sex: user.sex,
      province: user.province,
      city: user.city,
      country: user.country,
      headimgurl: user.headimgurl,
      unionid: user.unionid
    };
    localStorage.setItem(appid + '.user', JSON.stringify(user));
    return user;
  }

  /**
   * 获取用户当前地理位置
   *
   */
  function getLocation(cb) {
    wx.ready(function () {
      wx.getLocation({
        type: 'wgs84', //默认是wgs84(gps坐标),火星坐标:gcj02
        success: function (res) {
          var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
          var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
          var speed = res.speed; // 速度，以米/每秒计
          var accuracy = res.accuracy; // 位置精度
          cb(latitude, longitude);
        },
        fail: function (res) {
          cb();
        }
      });
    });

  }

  function openLocation(latitude, longitude, name, address, scale, infoUrl, cb) {
    wx.ready(function () {
      wx.openLocation({
        latitude: latitude, // 纬度，浮点数，范围为90 ~ -90
        longitude: longitude, // 经度，浮点数，范围为180 ~ -180。
        name: name, // 位置名
        address: address, // 地址详情说明
        scale: scale, // 地图缩放级别,整形值,范围从1~28。默认为最大
        infoUrl: infoUrl // 在查看位置界面底部显示的超链接,可点击跳转
      });
    });
  }

  function weixinShare(setting, successHandle) {
    wx.ready(function () {
      wx.onMenuShareAppMessage({
        title: setting.title, // 分享标题
        desc: setting.desc, // 分享描述
        link: setting.link || htmlUrl, // 分享链接
        imgUrl: setting.imgUrl || htmlUrl + 'img/xiao_zhi_300X300.jpg', // 分享图标
        type: 'link', // 分享类型,music、video或link，不填默认为link
        dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
        success: function () {
          if(typeof successHandle !== 'undefined' && successHandle)
            successHandle();
        },
        cancel: function () {}
      });

      wx.onMenuShareTimeline({
        title: setting.title, // 分享描述
        link: setting.link || htmlUrl, // 分享链接
        imgUrl: setting.imgUrl || htmlUrl + 'img/xiao_zhi_300X300.jpg', // 分享图标
        success: function () {
          if(setting.contextRoot) {
            $.ajax({
              url: setting.contextRoot + '/api/save/menuShareTimeline',
              type: 'post',
              data: { "openid": setting.openid, "link": setting.link, "desc": setting.title },
              success: function (data) {

              }
            });

            var kv = { "link": setting.link, "openid": setting.openid, "desc": setting.title, "type": "2" }
            TDAPP.onEvent(setting.title, "发送到朋友圈分享", kv);
          }
          if(typeof successHandle !== 'undefined' && successHandle) {
            successHandle();
          }
        },
        cancel: function () {}
      });
    });
  }

  /**
   * 选择图片
   */
  function chooseImage(count, callback) {
    if(!count) count = 1;
    if(count > 9) count=9;
    wx.chooseImage({
      count: count, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
        callback(localIds);
      }
    });
  }

  /**
   * 预览图片
   */
  function previewImage(current, urls) {
    wx.ready(function () {
      wx.previewImage({
        current: current, // 当前显示图片的http链接
        urls: urls // 需要预览的图片http链接列表
      });
    });
  }

  /**
   * 上传图片
   * @param callback
   */
  function uploadImage(localId, callback) {
    wx.uploadImage({
      localId: localId, // 需要上传的图片的本地ID，由chooseImage接口获得
      isShowProgressTips: 1, // 默认为1，显示进度提示
      success: function (res) {
        callback(res.serverId);
      }
    });
  }

  /**
   * 扫一扫
   * @param callback
   */
  function scanQRCode(callback) {
    wx.ready(function () {
      wx.scanQRCode({
        needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
        scanType: ['qrCode', 'barCode'], // 可以指定扫二维码还是一维码，默认二者都有
        success: function (res) {
          var result = res.resultStr; // 当needResult 为 1 时，扫码返回的结果
          callback(result);
        }
      });
    });
  }

  /**
   * 微信上传图片,存serverId到db
   * @param serverId
   */
  function saveUploadImg(serverId) {
    $.post(saveUploadImgUrl, { serverId: serverId }, function (data) {

    });
  }

  function getShortUrl(longUrl, callback) {
    //var longUrl = 'http://www.baidu.com';
    $.post(shortUrl, { longUrl: longUrl }, function (data) {
      callback(data);
    });
  }

  function clear(){
    if(localStorage){
      localStorage.clear();
    }
  }

})();