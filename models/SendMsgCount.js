/**
 * 群发消息累计次数记录
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var moment = require('moment');

var SendMsgCountSchema = mongoose.Schema({
  wechat: {type: ObjectId, ref: "ChannelWechat"}, //渠道
  count: { type: Number},//剩余次数
  yearMonth: { type: String},//年月
  dateStr: { type: String},//当天日期
  dayCount: { type: Number},//当天剩余次数
}, { timestamps: {} });

/**
 * 初始化群发累计记录
 * @param type
 * @param cb
 */
SendMsgCountSchema.statics.initData = function (type, wechat, cb) {
  //认证订阅号
  if(type == '2'){
    var sml = new SendMsgCount({
      wechat: wechat,
      dateStr: moment().format('YYYYMMDD'),
      dayCount: 1,
    });
    sml.save((e, o)=>{
      cb(e, o)
    });
  }else if(type == '4'){//认证服务号
    var sml = new SendMsgCount({
      wechat: wechat,
      count: 4,//认证服务号默认每月4次
      yearMonth: moment().format('YYYYMM'),
    });
    sml.save((e, o)=>{
      cb(e, o)
    });
  }else{
    cb(null, null);
  }
}

var SendMsgCount = mongoose.model('SendMsgCount', SendMsgCountSchema, 'sendMsgCounts');
module.exports = SendMsgCount;
