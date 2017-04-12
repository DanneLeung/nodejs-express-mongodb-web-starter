/**
 * 活动奖品数据模型
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var AwardSchema = new Schema({
  channel: { type: ObjectId, ref: "Channel" }, //渠道
  wechat: { type: ObjectId, index: true, ref: "Wechat" }, //使用的微信号
  type: { type: String, default: '01' }, //类型：01:实物，02.票类，03.优惠券，04.兑换码
  name: { type: String, default: '' }, //名称
  mark: { type: String, default: '' }, //名称标示，用于区分不同活动中不同奖品的区分
  num: { type: Number, default: 0 }, //每人每次奖品发放量
  usedNum: { type: Number, default: 0 }, //已使用奖品数
  value: { type: Number, default: 0 }, //实际价值
  price: { type: Number, default: 0 }, //公开价格
  stock: { type: Number, default: 0 }, //总的库存数量
  hasItems: { type: Boolean, default: false }, //是否有明细数据
  destUrl: { type: String, default: '' }, //兑换前往的目标url
  description: { type: String, default: '' }, //描述
  pic: { type: String, default: '' }, //奖品图片
  enabled: { type: Boolean, default: true } //使用
}, { timestamps: {} });
AwardSchema.index({ mark: 1, name: 1 }, { unique: true });

AwardSchema.statics.enabledList = function (channel, wechat, done) {
  console.log("****************** Award.enabledList", channel, wechat);
  mongoose.model('Award').find({ channel: channel, wechat: wechat, enabled: true }).exec(function (err, awards) {
    if(err) console.error(err);
    return done(awards ? awards : []);
  });
};

module.exports = mongoose.model('Award', AwardSchema, 'activityawards');
