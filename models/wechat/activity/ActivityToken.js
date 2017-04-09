/**
 * 活动参加凭证
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var uuid = require('node-uuid');
var moment = require('moment');

var ActivityTokenSchema = new Schema({
  user: { type: String, index: true }, //用户识别，手机号，openid等唯一可识别
  srcid: { type: String, index: true }, //生成TOKEN的元数据id
  url: { type: String, default: '' }, //可使用url
  date: { type: String, index: true, default: '' }, //有效日期时间
  token: { type: String, index: true, default: uuid.v4() }, //活动参与凭证，UUID
  counter: { type: Number, default: 0 }, //计数器，默认是0，没有机会，大于零才有机会
  usedAt: { type: Date, default: Date.now }
}, { timestamps: {} });

/**
 * 生成参加活动的token
 * @param user 用户识别
 * @param srcid 源数据id
 * @param url 目标url
 * @param date 日期,YYYYMMDD格式字符串或者Date数据，Date会被自动转换为YYYYMMDD格式字符串
 * @param count 数量
 * @param cb 回调
 */
ActivityTokenSchema.statics.generate = function (user, srcid, url, date, count, cb) {
  console.log('-----------------------------generate', user);
  if(typeof date == 'Date') {
    date = moment(date).format('YYYYMMDD');
  }
  let update = { $set: { counter: count } };
  ActivityToken.findOneAndUpdate({ user: user, srcid: srcid, url: url, date: date }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  }, (err, token) => {
    if(err) console.log(err);
    cb(null, token);
  });
}

/**
 * 参加活动：查找可参与活动token，并对计数器减一操作，并且返回更新后记录，如果token无效，则返回null。
 * @param user 用户识别
 * @param srcid 源数据id
 * @param url 目标url
 * @param date 日期,YYYYMMDD格式字符串或者Date数据，Date会被自动转换为YYYYMMDD格式字符串
 * @param token 活动参与使用的token
 * @param cb 回调
 */
ActivityTokenSchema.statics.doit = function (user, url, date, token, cb) {
  if(typeof date == 'Date') {
    date = moment(date).format('YYYYMMDD');
  }

  let update = { $inc: { counter: -1 } };
  let q = { user: user, url: url, date: date, token: token, counter: { $gt: 0 } };
  //大于零减一操作
  ActivityToken.findOneAndUpdate(q, update, {
    new: true
  }, (err, token) => {
    if(err) console.log(err);
    if(!token) {
      console.warn("************* ActivityToken.doit no token found ", q);
    }
    cb(null, token);
  });
}

/**
 * 验证活动token是否有效，不修改数据，有效时活动回调返回true。
 * @param token 活动参与使用的token
 * @param cb 回调
 */
ActivityTokenSchema.statics.valid = function (url, token, cb) {
  // if(typeof date == 'Date') {
  //   date = moment(date).format('YYYYMMDD');
  // }

  let q = { url: url, token: token, counter: { $gt: 0 } };
  //大于零减一操作
  ActivityToken.findOne(q, (err, t) => {
    if(err) console.log(err);
    cb(t);
  });
}
var ActivityToken = mongoose.model('ActivityToken', ActivityTokenSchema, 'activitytokens');
module.exports = ActivityToken;