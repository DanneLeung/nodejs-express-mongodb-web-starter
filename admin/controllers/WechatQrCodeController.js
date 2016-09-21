/**
 * Created by ZhangXiao on 2016/3/10.
 * 微信二维码
 */
var mongoose = require('mongoose')
  , _ = require('lodash')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , ChannelWechat = mongoose.model('ChannelWechat')
  , QrCode = mongoose.model('QrCode')
  , WechatGroup = mongoose.model('WechatGroup')
  , WechatToken = mongoose.model('WechatToken')
  , WechatShareLogs = mongoose.model('WechatShareLogs')
  , WechatOpenIdTicket = mongoose.model('WechatOpenIdTicket')
  , config = require('../../config/config');
var menuUtil = require('../../util/wechat/menuUtil');
var xml2js = require("xml2js");
var WechatAPI = require('wechat-api');
var async = require("async");
var moment = require("moment");

var baseUrl = "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=";


exports.list = function (req, res) {
  res.render("wechat/qrcode/qrCodeList");
}

exports.create = function (req, res) {
  res.render("wechat/qrcode/qrCodeForm");
}

exports.dataTable = function (req, res) {
  WechatGroup.find({"channelWechat": req.session.wechat._id}, (err, wgs)=>{
    QrCode.dataTable(req.query, {conditions: {"appid": req.session.wechat.appid}}, function (err, data) {
      async.map(data.data, (wf, cb)=>{
        wf.tags = getGroupNames(wf.tags, wgs);
        cb(null, wf);
      },(err, objs)=>{
        data.data = objs;
        res.send(data);
      })
    });
  })
}

function getGroupNames(ids, wgs){
  if(!ids || !wgs){
    return "";
  }
  ids = ids.split(',')
  var groupNames = "";
  ids.forEach(function(id){
    wgs.forEach(function(data){
      if(id == data.groupId){
        groupNames += "," + data.name
      }
    })
  })
  if (groupNames.length > 0) groupNames = groupNames.substr(1)
  return groupNames;
}

/**
 * 生成永久二维码(活动时使用)
 * @param req
 * @param res
 */
exports.createLimitQRCode = function (req, res) {
  var qrCode = new QrCode(req.body);
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
  api.registerTicketHandle(WechatJsTicket.getTicketToken, WechatJsTicket.saveTicketToken);
  api.createLimitQRCode(qrCode.sceneStr, function (err, result) {
    var ticket = result.ticket;
    qrCode.ticket = ticket;
    qrCode.url = baseUrl + ticket;
    qrCode.ticket = ticket;
    qrCode.appid = req.session.wechat.appid;
    qrCode.save();
    res.send(baseUrl + ticket);
    return;
  });
}

/**
 * 界面创建二维码
 * @param req
 * @param res
 */
exports.createQrCode = function (req, res) {
  var qrCode = new QrCode(req.body);
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  qrCode.appid = appid;
  var api = new WechatAPI(appid, appsecret, WechatToken.readToken, WechatToken.saveToken);
  if (qrCode.type == "1") {
    var sceneId = parseInt(Math.random() * 100000) + 1; //随机场景ID
    api.createTmpQRCode(sceneId, parseInt(qrCode.expireSeconds), function (err, result) {
      var ticket = result.ticket;
      qrCode.ticket = ticket;
      qrCode.url = baseUrl + ticket;
      qrCode.sceneStr = sceneId;//临时二维码的场景ID
      //过期时间
      var now = new Date();
      qrCode.expiresTime = new Date(now.setTime(now.getTime() + 1000 * parseInt(qrCode.expireSeconds)));
      qrCode.save(function (e, o) {
        var wot = new WechatOpenIdTicket();
        wot.ticket = o.ticket;
        wot.qrcode = o._id;
        wot.save(function (err, obj) {
        });

        if (e) {
          req.flash('error', "创建二维码失败！");
        } else {
          req.flash('success', "创建二维码成功！");
        }
        res.redirect("/wechat/qrcode/list");
      });
    });
  } else if (qrCode.type == "2") {
    api.createLimitQRCode(qrCode.sceneStr, function (err, result) {
      var ticket = result.ticket;
      qrCode.ticket = ticket;
      qrCode.url = baseUrl + ticket;
      qrCode.ticket = ticket;
      qrCode.expireSeconds = -1;
      qrCode.save(function (e, o) {
        if (e) {
          req.flash('error', "创建二维码失败！");
        } else {
          req.flash('success', "创建二维码成功！");
        }
        res.redirect("/wechat/qrcode/list");
      });
    });
  }
}

/**
 * 创建临时二维码(活动使用)
 * @param req
 * @param res
 */
exports.createTmpQRCode = function (req, res) {
  var qrCode = new QrCode(req.body);
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
  var sceneId = parseInt(Math.random() * 100000) + 1;
  api.createLimitQRCode(sceneId, parseInt(qrCode.expireSeconds), function (err, result) {
    var ticket = result.ticket;
    qrCode.ticket = ticket;
    qrCode.url = baseUrl + ticket;
    qrCode.ticket = ticket;
    qrCode.appid = req.session.wechat.appid;
    qrCode.save(function (e, o) {
      if (!e && o != null) {
        var wot = new WechatOpenIdTicket();
        wot.ticket = o.ticket;
        wot.qrcode = o._id;
        wot.save();
      }
    });
    res.send(baseUrl + ticket);
    return;
  });
}

/**
 * 分享创建的临时二维码
 * @param req
 * @param res
 */
exports.shareQRCode = function (req, res) {
  var openid = req.params.openid || req.body.openid || req.query.openid;
  if (!openid) {
    res.send("");
    return;
  }
  ChannelWechat.findOne({"appid": req.params.appid, "type": "4"}, function (e, o) {
    var api = new WechatAPI(o.appid, o.appsecret, WechatToken.readToken, WechatToken.saveToken);
    //1~~100000之间的数字
    var sceneId = parseInt(Math.random() * 100000) + 1;
    api.createTmpQRCode(sceneId, 604800, function (err, result) {
      var ticket = result.ticket;
      ////创建openid和sceneId绑定关系
      //var wechatOpenIdTicket = new WechatOpenIdTicket();
      //wechatOpenIdTicket.openid = openid;
      //wechatOpenIdTicket.ticket = ticket;
      //wechatOpenIdTicket.save();
      var json = {};
      json.ticket = ticket;
      json.url = baseUrl + ticket;
      json.sceneId = sceneId;
      json.expireSeconds = 604800;
      var now = new Date();
      json.expiresTime = new Date(now.setTime(now.getTime() + 604800 * 1000));
      res.send(json);
      return;
    });
  });
}

/**
 * 删除过期的二维码
 * @param req
 * @param res
 */
//exports.delete = function(req, res){
//    QrCode.remove({"type":"1", "expiresTime": {$lt: new Date()}}, function(err, result){
//        if(err){
//            req.flash('error', "删除二维码失败！");
//        }else{
//            req.flash('success', "删除二维码成功！");
//        }
//        res.redirect("/wechat/qrcode/list");
//    });
//}

/**
 * 延时临时二维码,对过期的临时二维码，重新生成新的临时二维码，还挂在此活动下
 * @param req
 * @param res
 */
exports.delay = function (req, res) {
  var id = req.params.id;
  QrCode.findOne({"_id": id}, function (err, qrCode) {
    if (err || qrCode == null) {
      req.flash('error', "延时二维码失败！");
      res.redirect("/wechat/qrcode/list");
      return;
    } else {
      var appid = req.session.wechat.appid;
      var appsecret = req.session.wechat.appsecret;
      var api = new WechatAPI(appid, appsecret, WechatToken.readToken, WechatToken.saveToken);
      var sceneId = parseInt(Math.random() * 100000) + 1;
      api.createTmpQRCode(sceneId, qrCode.expireSeconds, function (err, result) {
        if (err) {
          req.flash('error', "延时二维码失败！");
          res.redirect("/wechat/qrcode/list");
          return;
        }
        var ticket = result.ticket;
        var tickets = qrCode.ticket;
        tickets.push(ticket);
        qrCode.ticket = tickets;
        qrCode.url = baseUrl + ticket;
        qrCode.sceneStr = sceneId;//临时二维码的场景ID
        //过期时间
        var now = new Date();
        qrCode.expiresTime = new Date(now.setTime(now.getTime() + 1000 * parseInt(result.expireSeconds)));
        qrCode.save();//修改新的二维码
        //对应关系中重新增加对应关系记录
        var wot = new WechatOpenIdTicket();
        wot.ticket = ticket;
        wot.qrcode = qrCode._id;
        wot.save();
        req.flash('success', "延时二维码成功！");
        res.redirect("/wechat/qrcode/list");
        return;
      });
    }
  });
}

exports.qrCodeCountList = function (req, res) {
  res.render("wechat/qrcode/qrCodeCount", {"id": req.params.id});
}

exports.qrCodeCountDatatable = function (req, res) {
  WechatShareLogs.dataTable(req.query, {conditions: {"qrCode": req.params.id}}, function (err, result) {
    res.send(result);
  });
}

exports.scanQrCodeGroup = function (req, res) {
  WechatShareLogs.find({"qrCode": req.params.id}, function (err, result) {
    if (err || result.length == 0) {
      res.send();
      return;
    }
    var type1 = {
      value: 0,
      label: "关注扫码次数",
      color: "#F38630"
    };
    var type2 = {
      value: 0,
      label: "粉丝扫码次数",
      color: "#69D2E7"
    };
    result.forEach(function (o) {
      if (o.type == "1") {
        type1.value++;
      } else if (o.type == "2") {
        type2.value++;
      }
    });
    var datas = [];
    datas.push(type1);
    datas.push(type2);
    res.send(datas);
  });
}

/**
 * 统计最近10天的扫描次数
 * @param req
 * @param res
 */
exports.scanQrCodeGroupTop10 = function (req, res) {
  var before10Date = getBefore10Date();
  var b = moment().add('days', -9).format("YYYY/MM/DD 00:00:00");
  var queryDate = new Date(b);
  WechatShareLogs.find({
    "qrCode": req.params.id,
    "createdAt": {$gte: queryDate}
  }).sort({"createdAt": 1}).exec(function (err, result) {
    if (err || result.length == 0) {
      res.send();
      return;
    }

    var labels = [];//标题
    for (var i = 0; i < 10; i++) {
      before10Date.setDate(before10Date.getDate() + 1);
      var b = moment(before10Date);
      labels.push(b.format("YYYY-MM-DD"));
    }
    //1.筛选数据
    var datas = [];
    result.forEach(function (o) {
      var b = moment(o.createdAt);
      var dateStr = b.format("YYYY-MM-DD");
      if (contains(datas, dateStr + "|" + o.type)) {
        var data = getData(datas, dateStr + "|" + o.type);
        data.count++;
      } else {
        var obj = {};
        obj.dateStr = dateStr;
        obj.type = o.type;
        obj.count = 1;
        datas.push(obj);
      }
    });


    //2.分批找出两种类型的数据源
    var type1 = {
      fillColor: "rgba(220,220,220,0.5)",
      strokeColor: "rgba(220,220,220,1)",
      pointColor: "rgba(220,220,220,1)",
      label: "type1",
      pointStrokeColor: "#fff",
      data: getTypeData(datas, "1", labels)
    };
    var type2 = {
      fillColor: "rgba(151,187,205,0.5)",
      strokeColor: "rgba(151,187,205,1)",
      pointColor: "rgba(151,187,205,1)",
      label: "type2",
      pointStrokeColor: "#fff",
      data: getTypeData(datas, "2", labels)
    };
    var datasets = [];
    datasets.push(type1);
    datasets.push(type2);

    //3.组织最终数据
    var data = {};
    data.labels = labels;
    data.datasets = datasets;
    res.send(data);
  });
}

function getBefore10Date() {
  var now = new Date();
  now.setDate(now.getDate() - 10);
  return now;
}

function contains(map, key) {
  var flag = false;
  map.forEach(function (json) {
    if (json.dateStr + "|" + json.type == key) {
      flag = true;
      return;
    }
  });
  return flag;
}

function getData(map, key) {
  var data = null;
  map.forEach(function (json) {
    if (json.dateStr + "|" + json.type == key) {
      data = json;
      return;
    }
  });
  return data;
}

function getTypeData(map, type, labels) {
  var data = [];
  labels.forEach(function (dateStr) {
    var key = dateStr + "|" + type;
    if (contains(map, key)) {
      data.push(getData(map, key).count);
    } else {
      //var random = parseInt(Math.random()*10)+1;
      //data.push(random);
      data.push(0);
    }
  });
  return data;
}

/**
 * 长链接url转短链接
 * @param req
 * @param res
 */
exports.long2short = function (req, res) {
  var longUrl = req.param("longUrl");
  if (!longUrl || longUrl == null || longUrl == null) {
    res.send({"success": "0", "msg": "转换失败!"});
    return;
  }
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var api = new WechatAPI(appid, appsecret, WechatToken.readToken, WechatToken.saveToken);
  api.shorturl(longUrl, function (err, result) {
    if (err) {
      res.send({"success": "0", "msg": "转换失败!"});
      return;
    }
    res.send({"success": "1", "shortUrl": result.short_url});
  });
}
