/**
 * Created by ZhangXiao on 2016/3/31.
 * 用户微信H5端渠道用户自主注册
 */
var moment = require('moment');
var mongoose = require('mongoose');
var config = require('../../config/config');
var Wechat = mongoose.model('Wechat');
var WechatToken = mongoose.model('WechatToken');
// var WechatFans = mongoose.model('WechatFans');
var http = require('http');
var fs = require('fs');
var path = require('path');

/**
 * 微信端上传图片到微信服务器,下载到本地
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.uploadImages = function (req, res) {
  var serverId = req.query.serverId || req.body.serverId;
  var appid = req.query.appid || req.body.appid;
  if(serverId == null || serverId == '') {
    res.send({ error: 1, "msg": "上传图片未指定或者未传送" });
    return;
  }

  Wechat.findOne({ "appid": appid }).exec(function (e, o) {
    if(e || o == null) {
      res.send({ error: 1, "msg": "appid对应的微信公众号信息未配置" });
      return;
    } else {
      var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
      //下载图片到本地
      api.getLatestToken(function (err, token) {
        if(!err && token && token != null) {
          var identity = 'topic'; //帖子目录
          downLoadImg(token.accessToken, serverId, identity, function (file) {
            //记录上传图片的下载路径
            if(file) {
              res.send({ error: 0, "path": file });
            } else {
              res.send({ error: 0, "path": file });
            }
          });
        }
      });
    }
  });
};

function downLoadImg(token, serverId, identity, cb) {
  var options = {
    hostname: "file.api.weixin.qq.com",
    port: 80,
    path: "/cgi-bin/media/get?access_token=" + token + "&media_id=" + serverId,
    method: 'GET'
  };

  var req = http.request(options, function (res) {
    if(res.statusCode == 200) {
      //截取header中的文件名
      var disposition = res.headers['content-disposition'];
      var start = disposition.indexOf("\"") + 1;
      var end = disposition.lastIndexOf("\"") - start;
      var filename = disposition.substr(start, end);
      console.log(filename);
      //根据渠道标示创建目录
      var mnt = moment();
      var dir = path.join(config.file.local, mnt.year(), mnt.month(), mnt.date(), identity);
      if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      var filePath = path.join(dir, filename);
      //下载图片到本地服务器，文件名用serverId命名
      var file = fs.createWriteStream(filePath);
      res.pipe(file);
      console.log('download successful...', filePath);
      cb(filePath);
    } else {
      cb("");
    }
  });

  req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();
}