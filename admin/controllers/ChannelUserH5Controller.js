/**
 * Created by ZhangXiao on 2016/3/31.
 * 用户微信H5端渠道用户自主注册
 */
var mongoose = require('mongoose')
  , ChannelUser = mongoose.model('ChannelUser')
  , ChannelWechat = mongoose.model('ChannelWechat')
  , WechatToken = mongoose.model('WechatToken')
  , WechatFans = mongoose.model('WechatFans')
  , CheckCode = mongoose.model('CheckCode')
  , config = require('../../config/config');
var http = require('http');
var fs = require('fs');
var path = require('path');
var smsUtil = require('../../util/smsUtil');

/**
 * 微信端上传图片到微信服务器,下载到本地
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.saveUploadImg = function (req, res) {
  var serverId = req.param("serverId");
  var id = req.param("id");
  if (serverId == null || serverId == '') {
    res.send({"error": "1", "msg": "上传失败"});
    return;
  }
  ChannelUser.findOne({"_id": id}, function (e, o) {
    if (o.approvedStatus == '00' || o.approvedStatus == '03') {
      ChannelWechat.findOne({"channel": req.session.channelId}).populate("channel").exec(function (e, o) {
        if (e || o == null) {
          res.send({"error": "1", "msg": "未查到渠道配置微信相关参数"});
          return;
        } else {
          var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
          //下载图片到本地
          api.getLatestToken(function (err, token) {
            if (!err && token && token != null) {
              var identity = o.channel.identity;//渠道标示
              downLoadImg(token.accessToken, serverId, identity, function (file) {
                //记录上传图片的下载路径
                if (file) {
                  ChannelUser.update({"_id": id}, {"headImgs": file}, {multi: false, upsert: false}, function (e, o) {
                    console.log("update channel user headImg:", e, o);
                    if (!e) {
                      res.send({"success": "1", "headImgs": file});
                      return;
                    } else {
                      res.send({"success": "0", "msg": "上传照片失败"});
                      return;
                    }
                  });
                }
              });
            }
          });
        }
      });
    } else {
      res.send({"error": "1", "msg": "当前状态不允许上传证件照"});
      return;
    }
  });
}

function downLoadImg(token, serverId, identity, cb) {
  var options = {
    hostname: "file.api.weixin.qq.com",
    port: 80,
    path: "/cgi-bin/media/get?access_token=" + token + "&media_id=" + serverId,
    method: 'GET'
  };

  var req = http.request(options, function (res) {
    if (res.statusCode == 200) {
      //截取header中的文件名
      var disposition = res.headers['content-disposition'];
      var start = disposition.indexOf("\"") + 1;
      var end = disposition.lastIndexOf("\"") - start;
      var filename = disposition.substr(start, end);
      console.log(filename);
      //根据渠道标示创建目录
      var path = "public" + config.file.local + "/" + identity;
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
      }
      //下载图片到本地服务器，文件名用serverId命名
      var file = fs.createWriteStream(path + "/" + filename);
      res.pipe(file);
      console.log('download successful...');
      cb(config.file.local + "/" + identity + "/" + filename);
    } else {
      cb();
    }
  });

  req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();
}

exports.register = function (req, res) {
  res.render('users/register', {});
}

exports.registerViewFind = function (req, res) {
  var openid = req.param("openid");
  ChannelUser.findOne({"openid": openid}, function (e, o) {
    if (!e && o != null) {
      res.render('users/registerView', o);
    } else {
      res.render('users/registerView', {})
    }
  });
}

/**
 * 保存用户信息
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var channelUser = new ChannelUser(req.body);
  ChannelUser.findOne({"openid": channelUser.openid}, function (e, o) {
    //防止返回重新添加数据
    if (o != null) {
      res.render('users/uploadHeadImg', o);
      return;
    } else {
      channelUser.channelId = req.session.channelId;//渠道ID
      channelUser.approvedStatus = "00";//待提交
      channelUser.enabled = false;//未启用
      channelUser.save(function (e, o) {
        //渠道下的公众号ID
        res.render('users/uploadHeadImg', o);
      });
    }
  });
}

/**
 * 提交审批
 * @param req
 * @param res
 */
exports.submitApply = function (req, res) {
  var id = req.param("id");
  ChannelUser.update({"_id": id}, {"approvedStatus": "01"}, {multi: false, upsert: false}, function (e, o) {
    if (!e) {
      res.send({"success": "1"});
    } else {
      res.send({"success": "0", "msg": "提交审批失败"});
    }
  });
}

/**
 * 审批失败后修改再审批
 * @param req
 * @param res
 */
exports.submitReApply = function (req, res) {
  var id = req.param("id");
  var fullname = req.param("fullname");
  var email = req.param("email");
  ChannelUser.update({"_id": id}, {"approvedStatus": "01", "fullname": fullname, "email": email}, {
    multi: false,
    upsert: false
  }, function (e, o) {
    if (!e) {
      res.send({"success": "1"});
    } else {
      res.send({"success": "0", "msg": "提交审批失败"});
    }
  });
}

/**
 * 验证一个openid,mobile,numberID只能注册一个账户
 * @param req
 * @param res
 * @param next
 */
exports.unionCheck = function (req, res, next) {
  var username = req.param("username");
  var openid = req.param("openid");
  var mobile = req.param("mobile");
  var numberID = req.param("numberID");
  //一个微信用户只能注册一个账户
  ChannelUser.count({"openid": openid}, function (e, count) {
    if (count > 0) {
      res.send({"success": "0", msg: "同一微信用户只能注册一个账户"});
      return;
    } else {
      //用户名不能重复
      ChannelUser.findOne({"username": username}, function (e, o) {
        if (!e && o != null) {
          res.send({"success": "0", msg: "此用户名已被注册"});
          return;
        } else {
          //手机号
          ChannelUser.findOne({"mobile": mobile, "numberID": numberID}, function (e, o) {
            if (o != null) {
              res.send({"success": "0", msg: "此手机和身份证号已被注册"});
              return;
            } else {
              res.send({"success": "1"});
              return;
            }
          });
        }
      });
    }
  });

}

exports.sentValid = function (req, res) {
  var mobile = req.param("mobile");
  var checkCode = req.param("checkCode");
  //验证手机验证码
  CheckCode.findOne({"mobile": mobile, "type": "register", "used": false}, function (e, o) {
    if (e || o == null) {
      res.send({"success": "0", "msg": "验证码无效"});
    } else {
      var diff = o.expireAt.getTime() - new Date().getTime();
      if (diff <= 0) {
        new CheckCode().modifyUsed(mobile, "register");
        res.send({"success": "0", "msg": "验证码已过期"});
      } else {
        if (o.code === checkCode) {
          new CheckCode().modifyUsed(mobile, "register");
          res.send({"success": "1"});
        } else {
          res.send({"success": "0", "msg": "验证码错误"});
        }
      }
    }
  });

}

/**
 * 获取验证码
 * @param req
 * @param res
 */
exports.sendCheckCode = function (req, res) {
  var mobile = req.param("mobile");
  new CheckCode().sendToMobile(mobile, "register", function (o) {
    if (o && o.success == '1') {
      var code = o.data.code;
      console.log("code==========>", code);
      smsUtil.sendCheckCode2Phone(mobile, code, function (data) {
        res.send(data);
      });
      res.send({"success": "1"});
    } else {
      res.send(o);
    }
  });
}

exports.list = function (req, res) {
  //渠道下的公众号ID
  res.render('wechatFans/wechat/fansList', {id: req.params.id})
}

exports.datatable = function (req, res) {
  WechatFans.dataTable(req.query, {conditions: {"channelWechat": req.params.id}}, function (err, data) {
    res.send(data);
  });
}

//同步粉丝信息
exports.syncWechatFans = function (req, res) {
  var channelWechat = req.params.id;
  //1.修改公众号下的粉丝关注标记为 未关注
  //WechatFans.update({"channelWechat": channelWechat}, {"flag": false}, {multi: true, upsert: false}, function (e, o) {
  //  if (!e) {
      ChannelWechat.findOne({"_id": channelWechat}, function (err, wechat) {
        if (!err && wechat != null) {
          var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
          console.log('get user info start');
          //获取关注列表
          api.getFollowers(function (err, obj) {
            if (err) {
              console.log(err);
            } else {
              //总数
              var total = obj.total;
              console.log('total:', total);
              //单次取出数量
              var count = obj.count;
              //下一个起始的openid
              var next_openid = obj.next_openid;
              var data = obj.data.openid;

              if (data) {
                //循环取用户openid，存入db
                //判断openid是否存过，存过之后不再存储
                for (var i in data) {
                  //取最后一条的openid
                  next_openid = obj.next_openid;
                  var openid = data[i];
                  api.getUser(openid, function (err, result) {
                    if (!err) {
                      result.flag = true;//关注公众号的粉丝
                      result.channelWechat = channelWechat;//渠道公众号
                      WechatFans.findAndSave(result);
                    }
                  });
                }
              }

              //如果total大于10000，则取后面的数据时需要加上next_openid，一次循环直到取完为止
              while (total > count) {
                api.getFollowers(next_openid, function (err, result) {
                  if (!err) {
                    count += result.count;
                    next_openid = result.next_openid;
                    //循环存入db
                    data = result.data.openid;
                    if (data) {
                      for (var i in data) {
                        var openid = data[i];
                        api.getUser(openid, function (err, result) {
                          if (!err) {
                            result.flag = true;//关注公众号的粉丝
                            result.channelWechat = channelWechat;//渠道公众号
                            WechatFans.findAndSave(result);
                          }
                        });
                      }
                    }
                  }
                });
              }
            }
            req.flash('success', '同步成功!');
            res.redirect('/channel/wechatFans/list/' + channelWechat);
          });
          console.log('get user info end');
        } else {
          console.log('同步失败,未找到公众号信息');
        }
      });
    //}
    //else {
    //  console.log('同步失败，更新粉丝标记失败');
    //}
  //});
}
