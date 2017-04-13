'use strict';

var _ = require('lodash');
var moment = require('moment');
var async = require('async');
var WechatAPI = require('wechat-api');
var OAuth = require('wechat-oauth');

var mongoose = require('mongoose'),
  Wechat = mongoose.model('Wechat'),
  WechatFans = mongoose.model('WechatFans'),
  WechatToken = mongoose.model('WechatToken'),
  WechatAuthToken = mongoose.model('WechatAuthToken'),
  WechatJsTicket = mongoose.model('WechatJsTicket'),
  WechatMenuShare = mongoose.model('WechatMenuShare')

function handleError(res, err) {
  return res.status(500).send(err);
}

// Get list of brands
exports.index = function (req, res) {
  res.status(200).json({ message: "OK" });
};

exports.jsConfig = function (req, res) {
  //console.log("********** js config ...");
  var url = req.params.url || req.body.url || req.query.url;
  var appid = req.params.appid || req.body.appid || req.query.appid;
  //jsonp 传递参数
  var callback = req.params.callback || req.body.callback || req.query.callback;
  if(!url || url === '' || url == undefined) {
    res.send({ "error": "1", "msg": "url is null" });
    return;
  }
  var param = {
    debug: false,
    jsApiList: [
      'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'startRecord', 'stopRecord', 'onVoiceRecordEnd',
      'playVoice', 'pauseVoice', 'stopVoice', 'onVoicePlayEnd', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage',
      'downloadImage', 'translateVoice', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'hideMenuItems',
      'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView',
      'addCard', 'chooseCard', 'openCard'
    ],
    url: url
  };
  //TODO:要根据appid查某一个具体的参数配置
  Wechat.getWechat(appid, function (e, o) {
    if(e || !o) {
      res.send({ "error": "1", "msg": "未查到渠道配置微信相关参数" });
    } else {
      var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
      api.registerTicketHandle(WechatJsTicket.getTicketToken, WechatJsTicket.saveTicketToken);
      api.getJsConfig(param, function (err, result) {
        if(!err) {
          if(callback) {
            //console.log('jsonp callback params is========>', callback)
            res.send(callback + "(" + JSON.stringify(result) + ")")
            return;
          } else {
            res.send(result);
          }
        } else {
          console.error("wechat config error: " + err);
          res.send({ "error": "1", "msg": "getJsConfig api error" });
        }
      });
    }
  });
}

/**
 * 获取默认公众号的appid，查看getWechat函数。
 * @param req
 * @param res
 */
exports.getAppId = function (req, res) {
  console.log("**************** getAppId, channelId: ", req.session.channelId);
  Wechat.getWechat(req.session.appid, function (appid) {
    if(!appid) {
      res.send({ "success": "0", "msg": "未查到渠道配置微信相关参数" });
      return;
    } else {
      res.send({ "success": "1", "appid": appid });
      return;
    }
  });
}

/**
 * 根据微信公众号wid和用户unionid获取用户信息，通常是订阅号借用服务号认证授权获取用户信息时使用。
 * @param req
 * @param res
 */
exports.getUserByUnionId = function (req, res) {
  var appid = req.query.appid || req.body.appid || req.params.appid;
  var unionid = req.query.unionid || req.body.unionid || req.params.unionid;
  WechatFans.findByUnionId(appid, unionid, function (user) {
    //if (!user.hasOwnProperty('openid')) user.openid = '';
    if(!user) {
      console.warn("***************** fans with unionid %s and appid %s not found.", unionid, appid);
    }

    return res.status(200).json(user);
  });
}

/**
 * 根据用户openid获取用户信息。
 * @param req
 * @param res
 */
exports.getUser = function (req, res) {
  var openid = req.query.openid || req.body.openid || req.params.openid;
  WechatFans.findByOpenId(openid, function (user) {
    //if (!user.hasOwnProperty('unionid')) user.unionid = '';
    return res.status(200).json(user);
  });
}
/**
 * 获取微信粉丝信息，base认证，并且db中已经有数据
 * @param req
 * @param res
 */
exports.getUserinfo = function (req, res) {
  var code = req.query.code || req.body.code;
  var appid = req.query.appid || req.body.appid;
  var scope = req.query.scope || req.body.scope;

  console.log("$$$$$$$$$$$ 传入参数： code：%s, appid: %s, scope: %s", code, appid, scope);
  if(!code || code === '' || code == undefined) {
    res.send({ "error": "1", "msg": "code不能未空" });
    return;
  }
  //使用认证服务号取得用户信息
  Wechat.getWechat(appid, function (e, o) {
    let wid = o._id;
    if(e || o == null) {
      res.send({ "error": "1", "msg": "未查到渠道配置微信相关参数" });
    } else {
      var client = new OAuth(o.appid, o.appsecret, WechatAuthToken.readAuthToken, WechatAuthToken.saveAuthToken);
      //根据授权code换取access token，openid
      client.getAccessToken(code, function (err, result) {
        if(err && err != null) {
          console.log("用code获取access token失败:" + err + ",result: " + JSON.stringify(result));
          res.send({ "error": "1", "msg": "用code获取access token失败", result: {} });
        } else {
          console.log("%%%%%%%%%%%% 获得access token：" + JSON.stringify(result));
          // var accessToken = result.data.access_token;
          var openid = result.data.openid;
          var scope = result.data.scope;
          // 使用openid读取系统中认证服务器对应的openid的用户信息
          WechatFans.findByOpenId(openid, function (fan) {
            if(!fan) {
              //尝试获取微信用户信息
              if('snsapi_userinfo' == scope) {
                client.getUser({ openid: openid, lang: 'zh_CN' }, function (err, userInfo) {
                  var unionid = userInfo.unionid;
                  userInfo.wechat = we._id; //当前认证的wechatid
                  WechatFans.findAndSave(userInfo, function (fan) {
                    // 如果是借用服务号获取用户信息，则需要通过unionid获取
                    console.log('%%%%%%%%%%%% snsapi_userinfo,更新所有渠道绑定微信号:%s的用户信息： ', we._id, fan);
                    if(unionid) {
                      // 有绑定微信开发平台有unionid
                      WechatFans.findAndSaveByUnionId(unionid, userInfo, function (f) {
                        if(!f || !f.openid)
                          console.warn('********** 未找到wid: %s, unionid: %s 对应的微信粉丝，用户未关注微信, 先创建粉丝记录.', wid, unionid);
                        // f.wechat = null;
                        res.send({ "error": "0", "msg": "", result: f });
                      });
                    } else {
                      // 没有unionid，直接返回用户信息
                      // userInfo.wechat = null;
                      res.send({ "error": "0", "msg": "", result: fan });
                    }
                  });
                });
              } else {
                //snsapi_base时只返回openid
                res.send({ "error": "0", "msg": "", result: { openid: openid } });
              }
            } else {
              // 已经存在粉丝信息，检查当前wid是否与fan.wechat一致，如果不是，则判断为借用公众号(通常是订阅号借用服务号)获取用户信息，则需要通过unionid获取
              if(wid && fan.wechat._id.toString() != wid) {
                // fan.openid = result.data.openid;
                if(!fan.unionid) {
                  //unionid不存在(有可能是绑定开放平台前获得用户信息)，则再次通过接口获取用户信息
                  client.getUser({ openid: openid, lang: 'zh_CN' }, function (err, userInfo) {
                    var unionid = userInfo.unionid;
                    console.log(' !!!!!!!!!!!! 未找到wid: %s, unionid: %s 对应的微信粉丝，重新通过接口获得粉丝信息：', wid, unionid, userInfo);
                    Wechat.find({ "appid": appid }, function (e, os) {
                      async.map(os, (we, cbb) => {
                        userInfo.wechat = we._id; //当前认证的wechatid
                        WechatFans.findAndSave(userInfo, function (f) {
                          // 如果是借用服务号获取用户信息，则需要通过unionid获取
                          console.log('!!!!!!!!!! client.getUser,更新所有渠道绑定微信号:%s的用户信息： ', we._id, f);
                          return cbb(f);
                        });
                      }, (err, r) => {
                        if(unionid) {
                          // 有绑定微信开发平台有unionid
                          WechatFans.findAndSaveByUnionId(unionid, userInfo, function (f) {
                            if(!f || !f.openid)
                              console.log(' !!!!!!!!!!!! 未找到wid: %s, unionid: %s 对应的微信粉丝，用户未关注微信, 直接创建粉丝了记录.', wid, f.unionid);
                            // f.wechat = null;
                            res.send({ "error": "0", "msg": "", result: f });
                          });
                        } else {
                          // 没有unionid，直接返回用户信息
                          // userInfo.wechat = null;
                          console.error(' !!!!!!!!!!!! wid: %s, 借用: %s，但获得粉丝没有unionid，可能未绑定开放平台.', wid, wh._id);
                          res.send({ "error": "0", "msg": "", result: userInfo });
                        }
                      });
                    });
                  });
                } else {
                  //粉丝有unionid，确定已绑定开放平台
                  //更新appid对应多个配置wechat的粉丝信息
                  WechatFans.findAndSaveByUnionId(fan.unionid, fan, function (ff) {
                    if(!ff || !ff.openid)
                      console.log(' @@@@@@@@@@@@ 未找到wid: %s, unionid: %s 对应的微信粉丝，用户未关注微信, 直接创建粉丝了记录.', wid, fan.unionid);
                    console.log(' @@@@@@@@@@@@ 程序使用wid：%s, 借用wid: %s, 返回粉丝：', wid, fan.wechat._id, ff);
                    res.send({ "error": "0", "msg": "", result: ff });
                  });
                }
              } else {
                //返回数据库中的记录
                console.log(' ########## 程序使用wid：%s, 相同wid: %s, 返回粉丝：', wid, fan.wechat._id, fan);
                res.send({ "error": "0", "msg": "", result: fan });
              }
            }
          });
        }
      });
    }
  });
}

/**
 * 读取指定appid对应的最新的access token，自动检查token超时，用于其他系统读取
 * @param req
 * @param res
 */
exports.getAccessToken = function (req, res) {
  var token = req.params.token || req.query.token;
  var appid = req.params.appid || req.query.appid;
  //检查微信token
  if(!appid) {
    return res.send({ err: '参数appid必须传入', token: null });
  }
  if(!token) {
    return res.send({ err: '参数Token必须传入', token: null });
  }
  Wechat.findByAppid(appid, function (err, wechat) {
    if(err) {
      console.error(err);
      return res.send({ err: '找不到appid' + appid + "相对应的公众号.", token: null });
    }
    //检查微信token
    if(wechat.token != token) {
      return res.send({ err: '参数Token的值与微信公众号设置的不一致.', token: null });
    }
    var appsecret = wechat.appsecret;
    var api = new WechatAPI(appid, appsecret, WechatToken.readToken, WechatToken.saveToken);
    api.registerTicketHandle(WechatJsTicket.getTicketToken, WechatJsTicket.saveTicketToken);
    api.getLatestToken(function (err, token) {
      if(err) console.error(err);
      return res.send({ err: err, token: token });
    });
  });
}
var AccessToken = function (data) {
  if(!(this instanceof AccessToken)) {
    return new AccessToken(data);
  }
  this.data = data;
};

/*!
 * 检查AccessToken是否有效，检查规则为当前时间和过期时间进行对比
 *
 * Examples:
 * ```
 * token.isValid();
 * ```
 */
AccessToken.prototype.isValid = function () {
  return !!this.data.access_token && (new Date().getTime()) < (this.data.create_at + this.data.expires_in * 1000);
};
/**
 * 读取指定appid对应的认证授权access token，用于其他系统读取
 * @param req
 * @param res
 */
exports.getAuthAccessToken = function (req, res) {
  var token = req.params.token || req.query.token;
  var appid = req.params.appid || req.query.appid;
  var openid = req.params.openid || req.query.openid;
  //检查微信token
  if(!appid) {
    return res.send({ err: '参数appid必须传入', token: null });
  }
  if(!openid) {
    return res.send({ err: '参数openid必须传入', token: null });
  }
  if(!token) {
    return res.send({ err: '参数Token必须传入', token: null });
  }
  Wechat.findByAppid(appid, function (err, wechat) {
    if(err) {
      console.error(err);
      return res.send({ err: '找不到appid' + appid + "相对应的公众号.", token: null });
    }
    //检查微信token
    if(!wechat) {
      return res.send({ err: 'appid对应的微信公众号不在系统中.', token: null });
    }
    //检查微信token
    if(wechat.token != token) {
      return res.send({ err: '参数Token的值与微信公众号设置的不一致.', token: null });
    }
    var appsecret = wechat.appsecret;

    var oauth = new OAuth(appid, appsecret, WechatAuthToken.readAuthToken, WechatAuthToken.saveAuthToken);
    oauth.getToken(openid, function (err, data) {
      if(err) {
        console.error(err);
        return res.send({ err: err, token: null });
      }
      // 没有token数据
      if(!data) {
        return res.send({ err: err, token: null });
      }
      var token = new AccessToken(data);
      if(token.isValid()) {
        return res.send({ err: err, token: token });
      } else {
        oauth.refreshAccessToken(token.data.refresh_token, function (err, token) {
          if(err) {
            console.error(err);
            return res.send({ err: err, token: null });
          }
          return res.send({ err: err, token: token });
        });
      }
    });

  });
}

/**
 * 创建二维码
 * @param appid
 * @param appsecret
 * @param setting
 * @param cb
 */
exports.createQrCode = function (appid, appsecret, setting, sceneStr, cb) {
  var api = new WechatAPI(appid, appsecret, WechatToken.readToken, WechatToken.saveToken);
  api.registerTicketHandle(WechatJsTicket.getTicketToken, WechatJsTicket.saveTicketToken);
  //临时二维码
  if(setting.type == "1") {
    var sceneId = parseInt(Math.random() * 100000) + 1;
    api.createTmpQRCode(sceneId, parseInt(setting.expireSeconds), function (err, result) {
      cb(err, result);
    });
  } else {
    api.createLimitQRCode(sceneStr, function (err, result) {
      cb(err, result);
    });
  }
}

/**
 * 保存分享朋友圈log
 * @param req
 * @param res
 */
exports.saveMenuShareTimeline = function (req, res) {
  var openid = req.body.openid || req.params.openid;
  var link = req.body.link || req.params.link;
  var desc = req.body.desc || req.params.desc;
  if(!openid) {
    res.send("openid is null");
    return;
  }
  var data = {};
  async.waterfall([function (cb) {
    WechatFans.findOne({ "openid": openid }, (e, o) => {
      if(o) {
        data.wechat = o.wechat;
        data.wechatFans = o._id;
        data.openid = o.openid;
        data.nickname = o.nickname;
        data.type = '2';
        data.link = link;
        data.desc = desc;
        data.shareDate = moment().format("YYYY-MM-DD");
        data.shareTime = moment().format("YYYY-MM-DD HH:mm:ss");
        cb(null, data);
      } else {
        cb('wechat fans is not exists', null)
      }
    })
  }], function (err, result) {
    if(err) {
      return res.send(err);
    }
    WechatMenuShare.saveMenuShareTimeline(result, function (err, obj) {
      if(err) {
        res.send('save MenuShareTimeline fail.');
      } else {
        res.send('success')
      }
    })
  })
}