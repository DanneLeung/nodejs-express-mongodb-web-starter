/**
 * 活动统计
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ActivityStatSchema = new Schema({
  wechat: { type: ObjectId, ref: "ChannelWechat" }, //活动的微信号
  activity: { type: ObjectId, ref: "Activities" }, //参与的活动
  datetime: {type: Date, required: false, default: new Date()}, //统计时间段，每1或10分钟，根据系统合计精度而定
  userCount: { type: Number, default: 0 }, //访问和参与的用户数
  shareTimes: { type: Number, default: 0 }, //分享次数
  readTimes: { type: Number, default: 0 }, //访问次数，每访问一次+1
  playTimes: { type: Number, default: 0 }, //参与次数，每参与一次+1
  winTimes: { type: Number, default: 0 }, //获奖人数
  winTimesUpdateAt: {type: Date, required: false, default: new Date()}, //获奖时更新时间
  playTimesUpdateAt: {type: Date, required: false, default: new Date()} //日期 日更


});

module.exports = mongoose.model('ActivityStat', ActivityStatSchema, 'activitystats');
