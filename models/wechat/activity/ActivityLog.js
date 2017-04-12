/**
 * 活动用户日志
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ActivityLogSchema = new Schema({
  wechat: {type: ObjectId, ref: "Wechat"}, //活动的微信号
  activity: {type: ObjectId, ref: "Activities"}, //参与的活动
  datetime: Date, //访问日期时间
  ip: {type: String, default: ''}, //访问ip
  url: {type: String, default: ''}, //访问URL
  user: {
    member: {type: ObjectId, ref: 'Member'},
    fans: {type: ObjectId, ref: 'WechatFans'},
    mobile: {type: String, default: ''}, //手机
    fullname: {type: String, default: ''}, //真实姓名
    identity: {type: String, default: ''}, //身份证
    email: {type: String, default: ''}, //email
    openId: {type: String, default: ''}, //openId
    nickname: {type: String, default: ''}//昵称
  },
  action: {type: String, default: ''} //log用户操作，read, share, play, win
});
/**
 * lo日志
 * @param activity
 * @param params || null
 * @param user
 */
ActivityLogSchema.statics.createLog = function (params, done) {
  var log = new ActivityLog(params);
  log.save(function (err, l) {
    if (err) console.error(err);
    if (done) {
      return done(err, l);
    }
  })
};

var ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema, 'activitylogs');

module.exports = ActivityLog;