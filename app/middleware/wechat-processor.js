/**
 * Created by ZhangXiao on 2016/3/10.
 * 渠道微信公众号绑定
 */
var mongoose = require('mongoose'),
  _ = require('lodash'),
  Wechat = mongoose.model('Wechat'),
  WechatReply = mongoose.model('WechatReply'),
  WechatReplyLogs = mongoose.model('WechatReplyLogs'),
  WechatShareLogs = mongoose.model('WechatShareLogs'),
  WechatFans = mongoose.model('WechatFans'),
  // QrCode = mongoose.model('QrCode'),
  // ChannelSetting = mongoose.model('ChannelSetting'),
  Setting = mongoose.model('Setting'),
  WechatBranding = mongoose.model('WechatBranding'),
  WechatToken = mongoose.model('WechatToken'),
  WechatJsTicket = mongoose.model('WechatJsTicket'),
  Activities = mongoose.model('Activities'),
  WechatMessage = mongoose.model('WechatMessage'),
  config = require('../../config/config');
var menuUtil = require('../../util/wechat/menuUtil');
var wechatFansUtil = require('../../util/wechat/wechatFansUtil');
var wechatApiUtil = require('../../util/wechat/wechatApiUtil');
var xml2js = require("xml2js");
var WechatAPI = require('wechat-api');
var async = require("async");
var moment = require('moment');

var basePath = "";
var contextFront = "";
var identity = ""; //渠道标示

/**
 * 统一微信页面授权中转
 */
exports.authRoute = function (req, res, next) {
  //微信网页授权回掉路由
  var originalUrl = req.originalUrl;
  var p = '/wxroute';
  var idx = originalUrl.indexOf(p);
  var protocol = req.get("X-Forwarded-Proto") || req.protocol || "http";
  if(idx >= 0) {
    console.log("+++++++++++++++++++++++++++++++> original url: " + originalUrl + ", origin ip: " + req.ip);
    var url = originalUrl.substr(idx + p.length + 1);
    console.log("+++++++++++++++++++++++++++++++> redirect url: " + (protocol + '://' + url));
    res.redirect(protocol + '://' + url);
  } else {
    next();
  }
};

exports.checkWxg = function (req, res) {
  console.log('echostr+++++++++++++++++++++++++++++++> ' + req.param("echostr"));
  res.setHeader('content-type', 'text/plain');
  res.send(req.param("echostr"));
}

/**
 * 接收微信推送的信息
 * @param req
 * @param res
 */
exports.checkWxp = function (req, res) {
  xml2js.parseString(req.body, function (err, result) {
    console.log(err, result);
    if(err) {
      console.error("**************** 接收微信推送信息错误", err);
      res.end("success");
    }
    // if(result.xml && result.xml.Encrypt) {
    //   console.log("************ AppID: ", result.xml.AppId ? result.xml.AppId : "", "推送消息加密，暂时不能处理加密信息!");
    //   return;
    // }
    saveWechatMessage(result);
    var openid = result.xml.FromUserName[0];
    var originalId = result.xml.ToUserName[0];
    var event = result.xml.Event != null ? result.xml.Event[0] : null;
    var eventKey = result.xml.EventKey != null ? result.xml.EventKey[0] : null;
    var msgType = result.xml.MsgType != null ? result.xml.MsgType[0] : null;
    var content = result.xml.Content != null ? result.xml.Content[0] : null;
    var ticket = result.xml.Ticket != null ? result.xml.Ticket[0] : null;
    if(event) {
      if(event == 'subscribe' && eventKey == '') { //普通关注
        //获取粉丝信息，并打标记，是关注公众号获取的粉丝信息
        updateUserInfo(openid, originalId, null, function () {
          subscribe(openid, originalId, res);
          if(event == 'subscribe') {
            WechatFans.incSubscribeTimes(openid, (n) => {
              console.log("*************** 粉丝%s新关注!", openid);
            });
          }
        });
      } else if(event == 'unsubscribe') {
        unsubscribe(openid, res);
      } else if((event == 'SCAN' || event == "subscribe") && eventKey) { //扫描二维码关注
        updateUserInfo(openid, originalId, ticket, function () {
          if(event == 'subscribe') {
            WechatFans.incSubscribeTimes(openid, (n) => {
              console.log("*************** 粉丝%s新关注!", openid);
            });
          }
          //根据二维码对应的标签给粉丝打标签
          tagWechatFans(openid, ticket, originalId);
          console.log('taged the fans.....');
          if(eventKey.indexOf("qrscene_") > -1) {
            //新用户扫码
            saveShareLogs(originalId, openid, 1, req.body, eventKey, ticket);
            //推广新用户扫码统计
            brandingCount(ticket);
            subscribe(openid, originalId, res);
          } else {
            //老用户扫码
            saveShareLogs(originalId, openid, 2, req.body, eventKey, ticket);
            //推广老用户扫码统计
            brandingCountScanTimes(ticket);
            res.end("success");
          }
        });
      } else if(event == 'CLICK' && eventKey) {
        //自定义菜单事件触发消息推送
        menuClickReply(openid, originalId, eventKey, res);
      } else {
        res.end("success");
      }
    } else if(msgType && msgType == 'text') {
      //接收文本消息，分析文本中的内容是否包含关键字，根据关键字回复用户(推广码|员工号)
      WechatBranding.findOne({ $or: [{ "identifyNo": content }, { "user.employeeNo": content }] }, function (e, o) {
        if(o != null) {
          WechatFans.findOne({ "openid": openid }, function (e, wf) {
            if(wf != null && !wf.identifyNo) {
              //统计粉丝数量
              o.scanTimes = o.scanTimes + 1;
              o.gainFans = o.gainFans + 1;
              o.save();

              //标记粉丝
              WechatFans.update({ "openid": openid }, { "identifyNo": content }, function (err, oo) {
                if(o.flag == '2') {
                  replyText(openid, originalId, "感谢您关注兴业银行" + o.user.fullname + "网点", res);
                } else {
                  //取规则是 输入工号回复 的回复消息
                  WechatReply.findOne({
                    "originalId": originalId,
                    "replyType": "2",
                    "ruleName": "输入工号回复"
                  }, function (err, wr) {
                    if(wr != null) {
                      replyText(openid, originalId, wr.content, res);
                    }
                  });
                }
              });
            } else {
              //不能重复回复标记多人
              replyText(openid, originalId, "您已是粉丝用户，请勿重复输入，谢谢！", res);
              res.end("success");
            }
          });
        }
        /*else if (content.indexOf('话费') > -1) {
                //抢话费
                phoneFare(openid, originalId, res);
                }*/
        else {
          //关键字回复
          keyWordReply(openid, originalId, content, res);
        }
      });
    } else if(msgType && msgType == "location") {
      //用户发来的地理位置信息，根据地理位置信息找到附近网点推算给用户
      var location_X = result.xml.Location_X[0];
      var location_Y = result.xml.Location_Y[0];
      // nearBranches(openid, originalId, location_X, location_Y, res);
    } else {
      res.end("success");
    }
  });
};

/**
 * 根据二维码关联的标签，对粉丝打标签
 * @param openid
 * @param ticket
 * @param originalId
 */
function tagWechatFans(openid, ticket, originalId) {
  Wechat.findOne({ "originalId": originalId }, function (err, obj) {
    if(!obj) {
      return;
    }
    var appid = obj.appid;
    var appsecret = obj.appsecret;
    QrCode.findOne({ "appid": appid, "ticket": ticket }, (e, o) => {
      if(o) {
        var tags = o.tags;
        if(tags) {
          //检查用户已有标签数量，最多3个
          tags = tags.split(',');
          console.log('tags split=======>', tags)
          var tagUtil = new wechatFansUtil(appid, appsecret);
          //查粉丝已有标签  { tagid_list: [ 110, 112 ] }
          tagUtil.getUserTags(openid, (ee, oo) => {
            if(oo && oo.tagid_list) {
              console.log('openid has tags ====>', oo.tagid_list)
              tags = mergeTags(oo.tagid_list, tags); //合并已有标签和新标签，最多只取3个
              console.log('merge tags ====>', tags)
            }
            WechatFans.findOneAndUpdate({ "openid": openid }, { "groupId": tags }, (e, o) => {});
            //批量为用户打标签
            var tasks = [function (callback) {
              callback(null, null);
            }];
            var index = 0;
            tags.forEach((groupId) => {
              var task = function (tagId, callback) {
                if(index == 0) tagId = groupId;
                tagUtil.membersBatchtagging(tagId, openid, (e, o) => {
                  index++;
                  callback(e, tags[index]);
                })
              }
              tasks.push(task);
            })
            if(tasks.length > 0) {
              async.waterfall(tasks, function (err, obj) {
                console.log(err, obj)
              })
            }
          })
        }
      }
    })
  })
}

/**
 * 合并两个标签的数据，去重复，最多取3个
 * @param tags 原有标签
 * @param tagList 新标签
 * @returns {*}
 */
function mergeTags(tags, tagList) {
  if(tags.length >= 3) {
    return tags;
  }
  var tmpTags = []
  tagList.forEach(function (tag) {
    tmpTags.push((tag - 0));
  })
  tmpTags.forEach(function (groupId) {
    if(tags.length == 3) {
      return;
    }
    if(tags.indexOf(groupId) < 0) {
      tags.push(groupId);
    }
  })
  return tags;
}

/**
 * 抢话费
 */
function phoneFare(openid, originalId, res) {
  var now = new Date();
  Activities.findOne({ "name": "抢话费", "startTime": { $lte: now }, "endTime": { $gte: now } }, function (err, activities) {
    if(err || activities == null) {
      replyText(openid, originalId, "活动已结束", res);
      return;
    }
    //统计次数，看是否是10的倍数;
    var dateStr = moment(new Date()).format('YYYYMMDD');
    PhoneFareLogs.findOne({ "openid": openid }, function (e, log) {
      if(log == null) {
        var pfl = new PhoneFareLogs({
          openid: openid,
          dateStr: dateStr
        });
        pfl.save(function (e, o) {});
        //查次数
        PhoneFareCount.findOne({ "total": "total" }, function (err, count) {
          if(count == null) {
            var pfc = new PhoneFareCount({ "total": "total", "count": 1 });
            pfc.save(function (e, o) {});
            //增加一条这个时段的初始记录
            PhoneFareCount.checkWechatFans(function (err, obj) {});
            //标记粉丝
            WechatFans.findOneAndUpdate({ "openid": openid }, { "phoneFareFlag": "1" }, function (e, o) {});
            replyText(openid, originalId, "恭喜，您获得九折充话费奖品!请点击<a href='http://9cubic.cn/m/cib/phoneFare?cid=cib&wid=57353807f04b80792a2a0c0b'>话费充值</a>，参与此活动", res);
            return;
          } else {
            count.count = count.count + 1;
            count.save(function (e, o) {});
            if(count.count % 10 == 0) {
              //检查这个时段是否还有剩余中奖名额
              PhoneFareCount.checkWechatFans(function (err, obj) {
                if(err) {
                  replyText(openid, originalId, err, res);
                  return;
                } else {
                  replyText(openid, originalId, "恭喜，您获得九折充话费奖品!请点击<a href='http://9cubic.cn/m/cib/phoneFare?cid=cib&wid=57353807f04b80792a2a0c0b'>话费充值</a>，参与此活动", res);
                  //标记粉丝
                  WechatFans.findOneAndUpdate({ "openid": openid }, { "phoneFareFlag": "1" }, function (e, o) {});
                  return;
                }
              })
            } else {
              replyText(openid, originalId, "很遗憾，您没有中奖!", res);
              return;
            }
          }
        });
      } else {
        replyText(openid, originalId, "您已参加过活动!", res);
        return;
      }
    });
  });
}

/**
 * 查附近网点，推送5条消息
 * @param openid
 * @param originalId
 * @param x
 * @param y
 * @param res
 */
function nearBranches(openid, originalId, x, y, res) {
  async.waterfall([function (cb) {
    //type:4 微信认证公众号, "type": "4"
    Wechat.findOne({ "originalId": originalId }).populate("channel").exec(function (e, wechat) {
      if(e || wechat == null) {
        cb("附近无相关网点", null);
      } else {
        cb(null, wechat.channel);
      }
    });
  }, function (channel, cb) {
    //查渠道设置的搜索距离
    ChannelSetting.findOne({ "channel": channel._id, "code": "maxDistance" }, function (e, o) {
      if(e || o == null) {
        cb(null, channel, "10"); //默认10KM范围
      } else {
        cb(null, channel, o.value);
      }
    });
  }, function (channel, num, cb) {
    //查系统setting设置,设置到全局变量
    Setting.find({}, function (err, result) {
      if(err || result == []) {
        //设置默认数据
        basePath = "http://xcesys.com";
        contextFront = "/m";
        cb(null, channel, num);
      } else {
        result.forEach(function (data) {
          if(data.key == 'context.front') {
            contextFront = data.value;
          } else if(data.key == 'context.root') {
            basePath = data.value;
          }
        });
        cb(null, channel, num);
      }
    });
  }, function (channel, num, cb) {
    var query = { "channel": channel._id };
    identity = channel.identity; //设置渠道标示到全局变量
    var location = [y - 0, x - 0]; //发送位置的坐标
    Branch.collection.geoNear(location, {
      num: 4,
      spherical: true,
      query: query, //查询条件
      distanceMultiplier: 6371,
      maxDistance: parseInt(num) / 6371
    }, function (err, result) {
      if(err) {
        cb("附近无相关网点", null);
      } else {
        if(result.ok == 1) {
          var datas = [];
          for(var i = 0; i < result.results.length; i++) {
            var obj = result.results[i];
            var data = obj.obj;
            var d = Math.round(obj.dis * 100) / 100;
            data.dis = d + 'km';
            datas.push(data);
          }
          cb(null, datas);
        } else {
          cb("附近无相关网点", null);
        }
      }
    });
  }], function (err, result) {
    if(err) {
      replyText(openid, originalId, err, res);
    } else {
      //组织数据发图文消息
      var articles = "";
      if(result) {
        var i = 0;
        result.forEach(function (data) {
          var logo = data.logo;
          if(i == 0 && data.images && data.images.length > 0) {
            logo = data.images[0];
          }
          articles += "<item><Title><![CDATA[" + data.name + "]]></Title>" +
            "<Description><![CDATA[" + data.address + "]]></Description>" +
            "<PicUrl><![CDATA[" + contextFront + logo + "]]></PicUrl>" +
            "<Url><![CDATA[" + contextFront + "/branch/branchDetail?id=" + data._id + "&cid=" + identity + "]]></Url></item>";
          i++;
        });
        articles += "<item><Title><![CDATA[查看更多网点]]></Title>" +
          //"<Description><![CDATA[查看更多网点]]></Description>" +
          //"<PicUrl><![CDATA[http://mmbiz.qpic.cn/mmbiz/XSP3FPZLy2eVyib2eS0jbbLP7rEBsmIusib6mSdXpuS3HO2dwicWQG2wGYicogPnsOkicjSCNjaurBF8y8vITggTXKg/0?wx_fmt=jpeg]]></PicUrl>" +
          "<Url><![CDATA[" + contextFront + "/branch?cid=" + identity + "&lat=" + x + "&lng=" + y + "]]></Url></item>";
        articles = "<Articles>" + articles + "</Articles>";
      }

      var xml = "<xml><ToUserName><![CDATA[" + openid + "]]></ToUserName>" +
        "<FromUserName><![CDATA[" + originalId + "]]></FromUserName>" +
        "<CreateTime>" + new Date().getTime() + "</CreateTime>" +
        "<MsgType><![CDATA[news]]></MsgType>" +
        "<ArticleCount><![CDATA[" + (result.length + 1) + "]]></ArticleCount>" + articles + "</xml>";
      res.send(xml);
      saveLogs(originalId, openid, xml);
      res.end("success");
    }
  });
}

/**
 * 回复消息logs
 * @param originalId
 * @param openid
 * @param xml
 */
function saveLogs(originalId, openid, xml) {
  var wechatReplyLogs = new WechatReplyLogs();
  wechatReplyLogs.originalId = originalId;
  wechatReplyLogs.openid = openid;
  wechatReplyLogs.xml = xml;
  wechatReplyLogs.save();
}

/**
 * 获得粉丝，并扫码次数+1
 * @param openid
 * @param ticket
 */
function brandingCount(ticket) {
  WechatBranding.update({ "ticket": ticket }, { $inc: { "scanTimes": 1 } }, { "upsert": false, "multi": false }, function (e, o) {
    console.log("have e fans and scanTimes add 1");
  });

  //统计获得粉丝数量
  WechatBranding.findOne({ "ticket": ticket }, function (e, o) {
    if(o != null) {
      var identifyNo = o.identifyNo;
      WechatFans.count({ "identifyNo": identifyNo, "flag": true }, function (err, count) {
        if(!err) {
          o.gainFans = count;
          o.save();
        }
      });
    }
  });
}

/**
 * 扫码次数+1
 * @param openid
 * @param ticket
 */
function brandingCountScanTimes(ticket) {
  WechatBranding.update({ "ticket": ticket }, { $inc: { "scanTimes": 1 } }, { "upsert": false, "multi": false }, function (e, o) {
    console.log("scanTimes add 1");
  });
}

/**
 * 保存二维码分享信息
 * @param originalId
 * @param openid
 * @param type
 * @param xml
 */
function saveShareLogs(originalId, openid, type, xml, eventKey, ticket) {
  var shareLogs = new WechatShareLogs();
  shareLogs.originalId = originalId;
  shareLogs.openid = openid;
  shareLogs.type = type;
  shareLogs.xml = xml;
  shareLogs.eventKey = eventKey;
  shareLogs.ticket = ticket;
  async.waterfall([function (cb) {
    WechatFans.findOne({ "openid": openid }, function (e, o) {
      if(e || o == null) {
        cb("wechatFans not find with openid", shareLogs);
      } else {
        shareLogs.wechat = o._id;
        cb(null, shareLogs);
      }
    });
  }, function (data, cb) {
    //查不到的，不是活动的二维码,可能是用户分享或者其他的二维码
    QrCode.findOne({ "ticket": shareLogs.ticket }, function (e, o) {
      if(e || o == null) {
        shareLogs.flag = 2;
        cb(null, shareLogs);
      } else {
        shareLogs.flag = 1;
        shareLogs.qrCode = o;
        cb(null, shareLogs);
      }
    });
  }], function (err, result) {
    if(!err) {
      WechatShareLogs.count({ "originalId": originalId, "openid": openid, "ticket": ticket }, (e, count) => {
        if(count == 0) {
          shareLogs.save();
        }
      })
    }
  });
}

/**
 * 首次关注公众号时，发送消息
 * @param openid
 * @param rawId
 */
function subscribe(openid, originalId, res) {
  //江苏银行融享财富 订阅号
  if("gh_135ffece6ca3" == originalId) {
    var msg = "点击<a href='http://jskj.9cubic.com/wap/weixin-return.html?openid=" + openid + "'>帮朋友砍价</a>，打开链接!";
    replyText(openid, originalId, msg, res);
  } else {
    WechatReply.findOne({ "originalId": originalId, "replyType": "1" }, function (e, o) {
      if(e || o == null) {
        var msg = "欢迎关注公众号!";
        replyText(openid, originalId, msg, res);
      } else {
        if(o.type) {
          replyMsg(openid, originalId, o, res);
        }
      }
    });
  }
}

/**
 * 取消关注，修改粉丝信息为已取消关注1
 * @param openid
 */
function unsubscribe(openid, res) {
  WechatFans.update({ "openid": openid }, { "flag": false, subscribe: "0", unsubscribe_time: Date.now() }, { "upsert": false, "multi": true }, function (e, o) {
    if(e) console.error(err);
    res.end("success");
  });
}

/**
 *
 * @param {*} openid
 * @param {*} originalId
 * @param {*} ticket
 * @param {*} cb
 */
function updateUserInfo(openid, originalId, ticket, cb) {
  Wechat.findOne({ "originalId": originalId }, function (e, cw) {
    if(e || cw == null) {
      console.log("公众号不存在");
      return;
    } else {
      var api = new wechatApiUtil(cw.appid, cw.appsecret).getWechatApi();
      //微信api获取用户信息
      api.getUser(openid, function (err, userInfo) {
        if(!err) {
          userInfo.wechat = cw._id; //渠道公众号
          userInfo.flag = userInfo.subscribe && (userInfo.subscribe == "1" || userInfo.subscribe == 1);
          //TODO: 修改下面代码
          // 微信推广，ticket为识别字符串
          WechatBranding.findOne({ "ticket": ticket }, function (e, wb) {
            if(wb != null) {
              //新粉丝用ticket找到推广记录，新粉丝记录归属到此推广人员下
              userInfo.identifyNo = wb.identifyNo;
            }
            //检查appid是否有多个配置channelWechat
            Wechat.find({ "originalId": originalId }, function (e, cws) {
              async.map(cws, (we, cbb) => {
                userInfo.wechat = we._id;
                //不同渠道绑定的相同公众号的粉丝信息均要更新
                WechatFans.findAndSave(userInfo, function (fan) {
                  return cbb(fan);
                });
              }, (err, r) => {
                // 只有unionid和没有ticket时，被推广用户打开分享页，关注不带参二维码，
                // 订阅号借用服务号认证关注页面事先写入unionid对应用户关联的推广人员识别码，就近原则把粉丝归入该人员名下
                // 粉丝关注推送过来，要根据unionid
                if(userInfo.unionid) {
                  updateFansByUnionid(originalId, userInfo.unionid, userInfo, (fans) => {
                    async.map(fans, (wf, callback) => {
                      if(wf && !wf.openid && wf.identifyNo) {
                        WechatBranding.update({ "user.employeeNo": wf.identifyNo }, { $inc: { "gainFans": 1, "scanTimes": 1 } }, { "upsert": false, "multi": false }, function (e, o) {
                          console.log("have e fans and scanTimes add 1");
                          return callback(null, wf);
                        });
                      } else {
                        return callback(null, wf);
                      }
                    }, (err, result) => {
                      return cb(result);
                    });
                  });
                } else {
                  return cb(r);
                }
              });
            });
          });
          //只用于新用户,老用户不可用
        } else {
          console.log('api.getUser error================>', err);
          return cb();
        }
      });
    }
  });
}

/**
 * 根据公众号appid更新所有关联的粉丝信息（因为一个公众号可能绑定在多个渠道上）
 * @param {*} appid
 * @param {*} unionid
 * @param {*} fan
 * @param {*} cb
 */
function updateFansByUnionid(originalId, unionid, fan, cb) {
  Wechat.find({ "originalId": originalId }, function (e, cws) {
    async.map(cws, (we, cbb) => {
      WechatFans.findAndSaveByUnionId(we._id, unionid, fan, function (ff) {
        if(!ff || !ff.openid)
          console.log('!!!!!!!!!!!! 未找到wid: %s, unionid: %s 对应的微信粉丝，用户未关注微信, 直接创建粉丝了记录.', we._id, fan.unionid);
        return cbb(null, ff);
      });
    }, (err, fans) => {
      return cb(fans);
    });
  });
}
/**
 * 关键字回复
 * @param {*} openid
 * @param {*} originalId
 * @param {*} content
 * @param {*} res
 */
function keyWordReply(openid, originalId, content, res) {
  WechatReply.find({ "originalId": originalId, "replyType": "2" }, function (err, result) {
    if(err || result == null) {
      //replyText(openid, originalId, "您输入的关键字机器人无法回复", res);
      res.end("success");
    } else {
      var obj;
      result.forEach(function (data) {
        var rules = data.rules; //规则
        rules.forEach(function (rule) {
          if(rule.matchMode) {
            if(rule.matchMode == "contain") {
              if(content.indexOf(rule.keyWord) > -1) {
                obj = data;
                return;
              }
            } else if(rule.matchMode == "equal") {
              if(content == rule.keyWord) {
                obj = data;
                return;
              }
            }
          }
        });
      });
      //有匹配的内容，回复对应的信息
      if(obj) {
        replyMsg(openid, originalId, obj, res);
      } else {
        //replyText(openid, originalId, "您输入的关键字机器人无法回复", res);
        res.end("success");
      }
    }
  });
}

/**
 * 自定义菜单回复消息
 * @param openid
 * @param originalId
 * @param eventKey
 * @param res
 */
function menuClickReply(openid, originalId, eventKey, res) {
  WechatReply.find({ "originalId": originalId, "replyType": "2" }, function (e, result) {
    if(!e && result != null) {
      var obj;
      result.forEach(function (data) {
        var rules = data.rules; //规则
        rules.forEach(function (rule) {
          if(rule.matchMode) {
            if(rule.matchMode == "contain") {
              if(eventKey.indexOf(rule.keyWord) > -1) {
                obj = data;
                return;
              }
            } else if(rule.matchMode == "equal") {
              if(eventKey == rule.keyWord) {
                obj = data;
                return;
              }
            }
          }
        });
      });
      if(obj) {
        replyMsg(openid, originalId, obj, res);
        return;
      } else {
        res.end("success");
        return;
      }
    } else {
      res.end("success");
      return;
    }

  });
}

/**
 * 根据类型回复消息
 * @param openid
 * @param originalId
 * @param eventKey
 * @param res
 */
function replyMsg(openid, originalId, o, res) {
  if(o.type) {
    if(o.type == "text") {
      //处理关注回复时，增加昵称
      formatReplyMsg(openid, originalId, o, function (msg) {
        replyText(openid, originalId, msg, res);
      })
    } else if(o.type == "image") {
      replyImage(openid, originalId, o, res);
    } else if(o.type == "voice") {
      replyVoice(openid, originalId, o, res);
    } else if(o.type == "video") {
      replyVideo(openid, originalId, o, res);
    } else if(o.type == "news") {
      replyNews(openid, originalId, o, res);
    }
  }
}

function formatReplyMsg(openid, originalId, o, cb) {
  if(o.replyType == '1') {
    WechatFans.findOne({ "openid": openid }, function (err, wechat) {
      if(wechat != null) {
        String.prototype.format = function () {
          if(arguments.length == 0) return this;
          for(var s = this, i = 0; i < arguments.length; i++)
            s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
          return s;
        };

        var msg = o.content.format(wechat.nickname);
        return cb(msg);
      } else {
        return cb(o.content);
      }
    });
  } else {
    return cb(o.content);
  }
}

/**
 * 回复文本信息
 * @param openid
 * @param originalId
 * @param msg
 * @param res
 */
function replyText(openid, originalId, msg, res) {
  var xml = "<xml><ToUserName><![CDATA[" + openid + "]]></ToUserName>" +
    "<FromUserName><![CDATA[" + originalId + "]]></FromUserName>" +
    "<CreateTime>" + new Date().getTime() + "</CreateTime>" +
    "<MsgType><![CDATA[text]]></MsgType>" +
    "<Content><![CDATA[" + msg + "]]></Content>" +
    "</xml>";
  res.send(xml);
  saveLogs(originalId, openid, xml);
  res.end("success");
}

/**
 * 回复图片信息
 * @param openid
 * @param originalId
 * @param o
 * @param res
 */
function replyImage(openid, originalId, o, res) {
  var xml = "<xml><ToUserName><![CDATA[" + openid + "]]></ToUserName>" +
    "<FromUserName><![CDATA[" + originalId + "]]></FromUserName>" +
    "<CreateTime>" + new Date().getTime() + "</CreateTime>" +
    "<MsgType><![CDATA[" + o.type + "]]></MsgType>" +
    "<Image><MediaId><![CDATA[" + o.mediaId + "]]></MediaId></Image>" +
    "</xml>";
  res.send(xml);
  saveLogs(originalId, openid, xml);
  res.end("success");
}

function replyVoice(openid, originalId, o, res) {
  var xml = "<xml><ToUserName><![CDATA[" + openid + "]]></ToUserName>" +
    "<FromUserName><![CDATA[" + originalId + "]]></FromUserName>" +
    "<CreateTime>" + new Date().getTime() + "</CreateTime>" +
    "<MsgType><![CDATA[" + o.type + "]]></MsgType>" +
    "<Voice><MediaId><![CDATA[" + o.mediaId + "]]></Voice></Image>" +
    "</xml>";
  res.send(xml);
  saveLogs(originalId, openid, xml);
  res.end("success");
}

/**
 * 回复视频信息
 * @param openid
 * @param originalId
 * @param o
 * @param res
 */
function replyVideo(openid, originalId, o, res) {
  var xml = "<xml><ToUserName><![CDATA[" + openid + "]]></ToUserName>" +
    "<FromUserName><![CDATA[" + originalId + "]]></FromUserName>" +
    "<CreateTime>" + new Date().getTime() + "</CreateTime>" +
    "<MsgType><![CDATA[" + o.type + "]]></MsgType>" +
    "<Video><MediaId><![CDATA[" + o.mediaId + "]]></MediaId>" +
    "<Title><![CDATA[" + o.title == null ? "" : o.title + "]]></Title>" +
    "<Description><![CDATA[" + o.description == null ? "" : o.description + "]]></Description>" +
    "</Video>" +
    "</xml>";
  res.send(xml);
  saveLogs(originalId, openid, xml);
  res.end("success");
}

/**
 * 回复图文消息
 * @param openid
 * @param originalId
 * @param o
 * @param res
 */
function replyNews(openid, originalId, o, res) {
  //文章列表
  var articles = "";
  if(o.articles) {
    o.articles.forEach(function (data) {
      articles += "<item><Title><![CDATA[" + data.title + "]]></Title>" +
        "<Description><![CDATA[" + data.description + "]]></Description>" +
        "<PicUrl><![CDATA[" + data.picUrl + "]]></PicUrl>" +
        "<Url><![CDATA[" + data.url + "]]></Url></item>";
    });
    articles = "<Articles>" + articles + "</Articles>";
  }

  var xml = "<xml><ToUserName><![CDATA[" + openid + "]]></ToUserName>" +
    "<FromUserName><![CDATA[" + originalId + "]]></FromUserName>" +
    "<CreateTime>" + new Date().getTime() + "</CreateTime>" +
    "<MsgType><![CDATA[" + o.type + "]]></MsgType>" +
    "<ArticleCount><![CDATA[" + o.articleCount + "]]></ArticleCount>" + articles + "</xml>";
  saveLogs(originalId, openid, xml);
  res.send(xml);
  res.end("success");
}

/**
 * 保存用户推送的消息
 * @param req
 */
function saveWechatMessage(result) {
  var event = result.xml.Event != null ? result.xml.Event[0] : null;
  //事件推送信息不保存
  if(event != null) {
    return;
  }

  console.log("************ saveWechatMessage: ", JSON.stringify(result.xml));
  var wm = new WechatMessage({
    toUserName: result.xml.ToUserName[0],
    fromUserName: result.xml.FromUserName[0],
    createTime: result.xml.CreateTime[0],
    msgType: result.xml.MsgType[0],
    content: result.xml.Content != null ? result.xml.Content[0] : null,
    picUrl: result.xml.PicUrl != null ? result.xml.PicUrl[0] : null,
    mediaId: result.xml.MediaId != null ? result.xml.MediaId[0] : null,
    thumbMediaId: result.xml.ThumbMediaId != null ? result.xml.ThumbMediaId[0] : null,
    format: result.xml.Format != null ? result.xml.Format[0] : null,
    title: result.xml.Title != null ? result.xml.Title[0] : null,
    description: result.xml.Description != null ? result.xml.Description[0] : null,
    url: result.xml.Url != null ? result.xml.Url[0] : null,
    location_X: result.xml.Location_X != null ? result.xml.Location_X[0] : null,
    location_Y: result.xml.Location_Y != null ? result.xml.Location_Y[0] : null,
    scale: result.xml.Scale != null ? result.xml.Scale[0] : null,
    label: result.xml.Label != null ? result.xml.Label[0] : null,
    msgId: result.xml.MsgId != null ? result.xml.MsgId[0] : null
  });
  async.waterfall([function (cb) {
    Wechat.findOne({ "originalId": wm.toUserName }, function (err, cw) {
      if(err || !cw) {
        cb(err, null);
      } else {
        wm.wechat = cw._id;
        wm.channel = cw.channel;
        cb(null, wm);
      }
    });
  }, function (obj, cb) {
    //查openid,放入关联对象
    WechatFans.findOne({ "openid": obj.fromUserName }, function (err, fans) {
      if(err) {
        cb(err, null);
      } else if(!fans) {
        cb('fans is null', null);
      } else {
        obj.fans = fans._id;
        cb(null, obj);
      }
    })
  }, function (obj, cb) {
    //检查文本输入内容是否是关键词
    if(wm.msgType == 'text') {
      WechatReply.find({ "originalId": wm.toUserName, "replyType": "2" }, function (err, result) {
        if(err || result == null) {
          cb(null, obj);
        } else {
          var flag = false;
          result.forEach(function (data) {
            var rules = data.rules; //规则
            rules.forEach(function (rule) {
              if(rule.matchMode) {
                if(rule.matchMode == "contain") {
                  if(wm.content.indexOf(rule.keyWord) > -1) {
                    flag = true;
                    return;
                  }
                } else if(rule.matchMode == "equal") {
                  if(wm.content == rule.keyWord) {
                    flag = true;
                    return;
                  }
                }
              }
            });
          });
          obj.keyword = flag;
          cb(null, obj);
        }
      });
    } else {
      cb(null, obj);
    }
  }], function (err, result) {
    if(!err) {
      result.save(function (e, o) {});
    }
  });
}