/**
 * 微信线上签到模型，可以配置多个幸运九宫格
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var Lucky9Schema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道
  wechat: {type: ObjectId, ref: "ChannelWechat"}, //使用的微信号
  activity: {type: ObjectId, ref: "Activities"}, //使用的活动
  name: {type: String, required: true, default: ''}, //名称
  text: {type: String, required: true}, //文案，规则说明等，支持HTML
  bgimg: {type: ObjectId, required: false, ref: "File"}, //背景图案
  logo: {type: ObjectId, required: false, ref: "File"}, //活动logo，分享时使用
  title: {type: String, required: false, default: ''}, //图文标题，推送和分享使用
  description: {type: String, required: false}, //图文描述，推送和分享使用
  keywords: {type: String, required: false, default: ''}, //关键字，出发图文推送关键字
  online: {type: Boolean, default: false}, //上线
  enabled: {type: Boolean, default: true} //激活使用
}, {timestamps: {}});
//{ wechat: '56f49bcf633cc1e152a1c896', channel: '56e2716cbc846d2f494a9f87', 'activity.startTime': { '$lt': 1466414769621 }, 'activity.endTime': { '$gt': 1466414769621 } }
/**
 * 取得当前时间活动中的幸运九宫格游戏，本方法不判断enabled和online值，调用者应该检查并提示错误。
 * @param id
 * @param channel
 * @param wechat
 * @param done
 */
Lucky9Schema.statics.getCurrent = function (id, channel, wechat, done) {
  var q = {wechat: wechat};
  if (id) {
    q._id = id;
  } else {
    q.channel = channel;
  }
  console.log("*********** 幸运九宫格查询条件 ", q);
  Lucky9.findOne(q).populate('activity logo bgimg').exec(function (err, lucky9) {
    var now = Date.now();
    if (lucky9 && lucky9.activity) {
      //是否下线
      if (!lucky9.activity.enabled || !lucky9.activity.online) {
        return done('当前幸运九宫格活动已下线.', lucky9);
      }
      if (!lucky9.online) {
        return done('当前幸运九宫格活动已下线.', lucky9);
      }
      //时间比较
      var aSstartTime = lucky9.activity.startTime;
      var aEndTime = lucky9.activity.endTime;
      if (aSstartTime > now || aEndTime < now) {
        return done('抱歉，活动已经结束了!', lucky9);
      }
      if (now < lucky9.startTime || now > lucky9.endTime) {
        return done("抱歉，活动已经结束了!", lucky9);
      }
    }
    return done(err, lucky9);
  });
};

var Lucky9 = mongoose.model('Lucky9', Lucky9Schema, 'lucky9');
module.exports = Lucky9;
