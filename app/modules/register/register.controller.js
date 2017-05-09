/**
 * Created by ZhangXiao on 2016/3/31.
 * 用户微信H5端渠道用户自主注册
 */
var mongoose = require('mongoose')
var Member = mongoose.model('Member');
var config = require('../../../config/config');
var WechatAPI = require('wechat-api');
var http = require('http');
var fs = require('fs');
var path = require('path');
var captcha = require(config.root + '/helper/captcha');


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
    res.send({
      "error": "1",
      "msg": "上传失败"
    });
    return;
  }
  Member.findOne({
    "_id": id
  }, function (e, o) {
    if (o.approvedStatus == '00' || o.approvedStatus == '03') {
      Wechat.findOne({
      }).populate("channel").exec(function (e, o) {
        if (e || o == null) {
          res.send({
            "error": "1",
            "msg": "未查到渠道配置微信相关参数"
          });
          return;
        } else {
          var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
          api.registerTicketHandle(WechatJsTicket.getTicketToken, WechatJsTicket.saveTicketToken);
          //下载图片到本地
          api.getLatestToken(function (err, token) {
            if (!err && token && token != null) {
              var identity = o.channel.identity; //渠道标示
              downLoadImg(token.accessToken, serverId, identity, function (file) {
                //记录上传图片的下载路径
                if (file) {
                  Member.update({
                    "_id": id
                  }, {
                    "headImgs": file
                  }, {
                    multi: false,
                    upsert: false
                  }, function (e, o) {
                    console.log("update channel user headImg:", e, o);
                    if (!e) {
                      res.send({
                        "success": "1",
                        "headImgs": file
                      });
                      return;
                    } else {
                      res.send({
                        "success": "0",
                        "msg": "上传照片失败"
                      });
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
      res.send({
        "error": "1",
        "msg": "当前状态不允许上传证件照"
      });
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

//  normal users
exports.apply = function (req, res) {
  res.render(__dirname + '/views/register', {
    user: new Member({
      username: '',
      email: '',
      mobile: ''
    })
  });
};

exports.register = function (req, res) {
  res.render(__dirname + '/views/register', {});
}

exports.registerViewFind = function (req, res) {
  var openid = req.param("openid");
  Member.findOne({
    "openid": openid
  }, function (e, o) {
    if (!e && o != null) {
      res.render(__dirname + '/views/registerView', o);
    } else {
      res.render(__dirname + '/views/registerView', {})
    }
  });
}
exports.cap = function (req, res) {
  res.render(__dirname + '/views/captcha');
}
exports.go = function (req, res) {
  var b = captcha.validate(req, 'cap');
  res.render(__dirname + '/views/captcha', {
    'captcha': req.session['capcaptchaCode'],
    b: b
  });
}

/**
 * 保存用户信息
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var member = new Member(req.body);
  Member.findOne({
    "openid": member.openid
  }, function (e, o) {
    //防止返回重新添加数据
    if (o != null) {
      res.render(__dirname + '/views/uploadHeadImg', o);
      return;
    } else {
      member.approvedStatus = "00"; //待提交
      member.enabled = false; //未启用
      member.save(function (e, o) {
        //渠道下的公众号ID
        res.render(__dirname + '/views/uploadHeadImg', o);
      });
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
  Member.count({
    "openid": openid
  }, function (e, count) {
    if (count > 0) {
      res.send({
        "success": "0",
        msg: "同一微信用户只能注册一个账户"
      });
      return;
    } else {
      //用户名不能重复
      Member.findOne({
        "username": username
      }, function (e, o) {
        if (!e && o != null) {
          res.send({
            "success": "0",
            msg: "此用户名已被注册"
          });
          return;
        } else {
          //手机号
          Member.findOne({
            "mobile": mobile,
            "numberID": numberID
          }, function (e, o) {
            if (o != null) {
              res.send({
                "success": "0",
                msg: "此手机和身份证号已被注册"
              });
              return;
            } else {
              res.send({
                "success": "1"
              });
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
  CheckCode.findOne({
    "mobile": mobile,
    "type": "register",
    "used": false
  }, function (e, o) {
    if (e || o == null) {
      res.send({
        "success": "0",
        "msg": "验证码无效"
      });
    } else {
      var diff = o.expireAt.getTime() - new Date().getTime();
      if (diff <= 0) {
        new CheckCode().modifyUsed(mobile, "register");
        res.send({
          "success": "0",
          "msg": "验证码已过期"
        });
      } else {
        if (o.code === checkCode) {
          new CheckCode().modifyUsed(mobile, "register");
          res.send({
            "success": "1"
          });
        } else {
          res.send({
            "success": "0",
            "msg": "验证码错误"
          });
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
      res.send({
        "success": "1"
      });
    } else {
      res.send(o);
    }
  });
}

exports.list = function (req, res) {
  //渠道下的公众号ID
  res.render(__dirname + '/wechatFans/wechat/fansList', {
    id: req.params.id
  })
}

exports.datatable = function (req, res) {
  WechatFans.dataTable(req.query, {
    conditions: {
      "wechat": req.params.id
    }
  }, function (err, data) {
    res.send(data);
  });
}
