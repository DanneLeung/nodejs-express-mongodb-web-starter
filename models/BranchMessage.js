/**
 * 网点服务项预约记录
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var BranchMessageSchema = new Schema({
  wechat: {type: ObjectId, ref: "ChannelWechat"}, //活动的微信号
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道，渠道内部公众号间共享
  branch: {type: ObjectId, ref: "Branch"}, //网点
  datetime: Date, //留言时间
  isReaded: {type: Boolean, default: false}, //留言或评价是否已读
  isHandle: {type: Boolean, default: false}, //留言是否已处理
  message: {type: String, default: ''}, //留言或评价内容
  feedback: {type: String, default: ''}, //反馈内容
  isDisplay: {type: String, default: true}, //留言是否在前台显示
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
}, {timestamps: {}});

var BranchMessage = mongoose.model('BranchMessage', BranchMessageSchema, 'branchmessage');

module.exports = BranchMessage;
