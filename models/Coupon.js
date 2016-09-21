/**
 * 券数据模型
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var CouponSchema = new Schema({
  channel: {type: ObjectId, ref: "Channel"},//渠道
  code: {type: String, required: true, default: ''},//标识
  name: {type: String, required: true, default: ''},//名称
  type: {type: String, required: true, default: ''},//券类型
  value: {type: Number, default: 0},//面值
  price: {type: Number, default: 0},//售价
  needScore: {type: Number, default: 0},//所兑换积分数
  max: {type: Number, default: 0},//发行最大数量
  currentNo: {type: Number, default: 0},//发行当前序号，+1下一个序号
  publishBegin: {type: Date, default: Date.now()},//发行开始
  publishEnd: {type: Date, default: Date.now()},//发行结束
  publishCount: {type: Number, default: 0},//已发行数量，已领取数量
  usedCount: {type: Number, default: 0},//已被使用数量
  enabled: {type: Boolean, default: true},//激活
  empty: {type: Boolean, default: false},//是否已领取完标记
  // publishBeginStr: {type: String, default: ''},//发行开始
  // publishEndStr: {type: String, default: ''},//发行结束
  description: {type: String, default: ''}//描述
});
CouponSchema.index({channel:1,name:1},{unique:true});
CouponSchema.index({channel:1,code:1},{unique:true});

module.exports = mongoose.model('Coupon', CouponSchema, 'coupons');
