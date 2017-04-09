/**
 * 活动白名单
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var WhiteListSchema = new Schema({
  channel: { type: ObjectId, ref: "Channel" }, //渠道
  wechat: { type: ObjectId, ref: "ChannelWechat" }, //使用的微信号
  name: { type: String, default: '' },
  total: { type: Number, default: 0 }, //白名单内人数
  description: { type: String, default: '' },
  list: [{
    mobile: { type: String, default: '' }, //手机
    fullname: { type: String, default: '' }, //真实姓名
    identity: { type: String, default: '' }, //身份证
    email: { type: String, default: '' }, //email
    openId: { type: String, default: '' }, //openId
    nickname: { type: String, default: '' }
  }],
  enabled: { type: Boolean, default: true } //使用
}, { timestamps: {} });

module.exports = mongoose.model('ActivityWhiteList', WhiteListSchema, 'activitywhitelist');