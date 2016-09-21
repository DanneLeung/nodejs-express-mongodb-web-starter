/**
 * 网点服务项预约记录
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var BookingRecordSchema = new Schema({
  wechat: {type: ObjectId, ref: "ChannelWechat"}, //活动的微信号
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道，渠道内部公众号间共享
  service: {type: ObjectId, ref: "ServiceItem"}, //预约的服务项
  branch: {type: ObjectId, ref: "Branch"}, //预约的网点
  datetime: Date, //预约时间
  submitTime: Date, //提交时间
  status: {type: String, default: '01', index: true}, //状态，01：未处理、02：已处理
  feedback: {type: String, default: ''}, //反馈内容
  user: {
    member: {type: ObjectId, ref: 'Member'},//会员用户
    fans: {type: ObjectId, ref: 'WechatFans'},//微信用户
    mobile: {type: String, default: ''}, //手机
    fullname: {type: String, default: ''}, //真实姓名
    identity: {type: String, default: ''}, //身份证
    email: {type: String, default: ''}, //email
    openId: {type: String, default: ''}, //openId
    nickname: {type: String, default: ''}//昵称
  }
});

var BookingRecord = mongoose.model('BookingRecord', BookingRecordSchema, 'bookingrecords');

module.exports = BookingRecord;
