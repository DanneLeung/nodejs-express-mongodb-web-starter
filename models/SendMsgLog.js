/**
 * 群发消息已发送log记录
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var moment = require('moment');

var SendMsgLogSchema = mongoose.Schema({
  wechat: {type: ObjectId, ref: "ChannelWechat"}, //渠道
  type: { type: String},//消息类型
  sendTime: { type: Date, default: new Date()},//发送时间
  content: { type: String, default: ''},//文本消息内容
  mediaId: { type: String, default: ''},//其他消息格式ID
  url: { type: String, default: ''},//图文url
  thumbMediaId: { type: String, default: ''},//图文缩略图ID
  recivers: { type: String},//接收者
  sendErr: {},//发送结果错误反馈
  sendResult: {},//发送反馈结果
}, { timestamps: {} });

//{ errcode: 0,
//  errmsg: 'send job submission success',
//  msg_id: 3147483649,
//  msg_data_id: 2651729461 }

var SendMsgLog = mongoose.model('SendMsgLog', SendMsgLogSchema, 'sendMsgLogs');
module.exports = SendMsgLog;
