/**
 * H5在现场红包记录
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var OnSiteListSchema = mongoose.Schema({
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  wechat: { type: ObjectId, ref: "ChannelWechat" }, //使用的微信号
  onsite: { type: String, ref: "OnSite" }, //使用的微信号
  user: {
    wechatFans: { type: ObjectId, ref: 'WechatFans' },
    openid: String,
    unionid: String,
    nickname: String,
    headimgurl: String
  },
  redpack: {
    amount: { type: Number, default: 0 }, //红包金额，保留两位小数
    text: { type: String, default: '' }, //领得红包后显示文字
    count: { type: Number, default: 1 } //该红包总数量
  }
}, { timestamps: {} });

var OnSiteList = mongoose.model('OnSiteList', OnSiteListSchema, 'onsitelists');
module.exports = OnSiteList;