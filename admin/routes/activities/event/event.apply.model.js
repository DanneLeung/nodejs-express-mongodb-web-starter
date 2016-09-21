/**
 * 线下活动报名数据
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var EventApplySchema = mongoose.Schema({
  event: {type: String, ref: "Event"}, //所属渠道
  wechat: [{type: ObjectId, ref: "ChannelWechat"}], //使用的微信号
  user: {
    openId: {type: String, required: true, default: ""},    //openId
    headimgurl: {type: String, trim: true},
    nickName: {type: String, required: false, default: ""},
    mobile: {type: String, required: false, default: ""},
  },
  applyTime: {type: Date, default: new Date()},//申请时间
  signedTime: {type: Date, default: new Date()},//签到时间
  signed: Boolean,//是否签到
}, {timestamps: {}});



module.exports = mongoose.model('EventApply', EventApplySchema, 'eventapplies');

