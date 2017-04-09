/**
 * 扫码领券记录
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var GetCouponListSchema = mongoose.Schema({
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  wechat: { type: ObjectId, ref: "ChannelWechat" }, //使用的微信号
  getcoupon: { type: String, ref: "GetCoupon" }, //使用的微信号
  user: {
    wechatFans: { type: ObjectId, ref: 'WechatFans' },
    openid: String,
    unionid: String,
    nickname: String,
    headimgurl: String,
    mobile: String
  },
  award: { type: ObjectId, ref: "Award" }, //使用的微信号
  awardItem: { type: ObjectId, ref: "AwardItem" },
  no: { type: String, default: '', index: true }, //编号
  code: { type: String, default: '' }, //密码，兑换号
}, { timestamps: {} });

var GetCouponList = mongoose.model('GetCouponList', GetCouponListSchema, 'getcouponlists');
module.exports = GetCouponList;