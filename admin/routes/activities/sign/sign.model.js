/**
 * 微信线上签到模型，可以配置多个签到活动
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var SignSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道
  wechat: {type: ObjectId, index: true, ref: "ChannelWechat"}, //使用的微信号
  name: {type: String, required: true, default: ''}, //名称
  startTime: {type: Date, required: true}, //活动开始时间
  endTime: {type: Date, required: true}, //活动结束时间
  bgimg: {type: ObjectId, required: false, ref: "File"}, //背景图案
  point: {type: Number, required: false, default: 0}, //每天签到获得积分
  text: {type: String, required: false}, //文案，规则说明等，支持HTML
  successText: {type: String, required: false}, //签到成功文案
  successRedirect: {type: String, required: false, default: ''}, //成功后重定向
  genToken: {type: Boolean, default: false},//是否需要密钥
  failText: {type: String, required: false}, //签到失败文案，** 暂时预留
  logo: {type: ObjectId, required: false, ref: "File"}, //活动logo，分享时使用
  shareTitle: {type: String, required: false}, //分享时使用的标题
  shareDesc: {type: String, required: false}, //分享时使用的描述
  keywords: {type: String, required: false, default: ''}, //关键字
  title: {type: String, required: false, default: ''}, //图文标题
  description: {type: String, required: false}, //图文描述，用于分享
  //needDays: {type: Number, required: false, default: 0}, //需要连续签到几天
  //registered: {type: Boolean, default: true},//必须注册用户，粉丝
  rules: [{}],//连续签到积分奖励规则等
  enabled: {type: Boolean, default: false} //激活使用
}, {timestamps: {}});

/**
 * 取得当前时间正在执行的签到活动
 * @param id
 * @param channel
 * @param wechat
 * @param done
 */
SignSchema.statics.getCurrent = function (id, channel, wechat, done) {
  var q = {};
  if (id) {
    q._id = id;
  } else {
    if (!channel) {
      console.log("******************* channel not found(sign getCurrent). ", wechat);
    } else {
      q.channel = channel;
    }
    if (wechat) {
      q.wechat = wechat;
    }
  }
  var now = Date.now();
  q.startTime = {$lt: now};
  q.endTime = {$gt: now};
  q.enabled = true;
  console.log("************************* 签到活动查询条件 ", q);
  Sign.findOne(q).populate('logo').exec(function (err, sign) {
    return done(err, sign);
  });
}

SignSchema.pre('save', function (done) {
  var that = this;
  done();
}, {timestamps: {}});
var Sign = mongoose.model('Sign', SignSchema, 'wechatsign');
module.exports = Sign;
