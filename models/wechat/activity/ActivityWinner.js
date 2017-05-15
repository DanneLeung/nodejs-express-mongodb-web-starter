/**
 * 活动获奖名单
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ActivityWinnerSchema = new Schema({
  wechat: { type: ObjectId, ref: "Wechat" }, //使用的微信号
  activity: { type: ObjectId, ref: "Activities" }, //参与的活动
  user: {
    member: { type: ObjectId, ref: 'Member' },
    fans: { type: ObjectId, ref: 'WechatFans' },
    mobile: { type: String, default: '' }, //手机
    fullname: { type: String, default: '' }, //真实姓名
    identity: { type: String, default: '' }, //身份证
    email: { type: String, default: '' }, //email
    openId: { type: String, default: '' }, //openId
    nickname: { type: String, default: '' }
  },
  awards: {
    level: Number, //几等奖，数值控制，1，2，3，4，5 ...
    time: { type: Date, default: Date.now }, //中奖时间
    awardName: String, //奖项名称，可以使用下拉框同时控制level和awardName
    award: require('./ActivityAward').schema, //奖品
    count: { type: Number, default: 1 }, //奖品数
    item: [mongoose.model('AwardItem').schema] //明细
  }
}, { timestamps: {} });

module.exports = mongoose.model('ActivityWinner', ActivityWinnerSchema, 'activitywinners');