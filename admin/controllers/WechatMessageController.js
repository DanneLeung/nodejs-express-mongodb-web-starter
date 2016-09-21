/**
 * Created by ZhangXiao on 2016/3/10.
 * 微信消息管理
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var xml2js = require("xml2js");
var moment = require('moment');

var config = require('../../config/config');
var WechatMessage = mongoose.model('WechatMessage');
var sendMsgUtil = require('../../util/wechat/sendMsgUtil');

exports.index = function (req, res) {
  WechatMessage.count({'tag':true},function(err,num){
    res.render('wechat/message/message',{count:num});
  });
}
//全部数据
exports.dataTable = function (req, res) {
  var time = req.query.time || req.body.time;
  var query = {}
  if(time){
    var op = time.split(" - ");
    var start = new Date(moment(op[0]));
    var end = new Date(moment(op[1]));
    query.createdAt = {$gte:start,$lt:end}
  }
  query.wechat = req.session.wechat._id;
  WechatMessage.dataTable(req.query,{conditions:query}, function (err, data) {
      res.send(data);
    });
}

//已收藏的数据
exports.datatableColl = function (req, res) {
  WechatMessage.dataTable(req.query,{conditions:{'tag':true}}, function (err, data) {
      res.send(data);
    });
}

/**
 * 是否使用该奖项
 * @param req
 * @param res
 */
exports.tag = function (req, res) {
  var id = req.params.id;
  var updata = {};
  WechatMessage.findOne({'_id': id}, function (err, msg) {
    if (!err) {
      if (msg.tag == true) {
        updata.tag = false;
      } else {
        updata.tag = true;
      }
      WechatMessage.update({'_id': id}, updata, {}, function (err, info) {
        if (!err) {
          req.flash('success', updata.tag ? '已收藏':'取消收藏');
          res.redirect('/wechat/messages');
        }
      });
    } else {
      console.error(err);
    }
  });
};

/**
 * 保存回复信息
 * @param req
 * @param res
 */
exports.save = function(req, res){
  WechatMessage.findOne({"_id": req.body.msgId}).populate('wechat fans').exec(function(e, wm){
    if(e || wm == null){
      req.flash('error', '回复失败!');
      res.redirect('/wechat/messages');
      return;
    }
    var content = req.body.content;
    var replyMsgs = wm.replyMsgs;
    replyMsgs.push(content);
    WechatMessage.findOneAndUpdate({"_id": req.body.msgId},{'replyTag': true, 'replyMsgs': replyMsgs}, function(e, o){
      if(e || o == null){
        req.flash('error', '回复失败!');
        res.redirect('/wechat/messages');
        return;
      }
      //发送消息
      var data = {
        channel: wm.channel,
        wechat: wm.wechat,
        fans: wm.fans,
        originalId: wm.wechat.originalId,
        openid: wm.fans.openid
      };
      var smUtil = new sendMsgUtil(wm.wechat.appid, wm.wechat.appsecret);
      smUtil.sendText(data, content, function(e, o){})
      req.flash('success', '回复成功!');
      res.redirect('/wechat/messages');
    });
  });
}
