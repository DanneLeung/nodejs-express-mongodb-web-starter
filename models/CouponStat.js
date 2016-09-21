/**
 * 线下活动及报名
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CouponStatSchema = mongoose.Schema({
  channel: {type: ObjectId, ref: "Channel"},//渠道
  coupon: {type: ObjectId, ref: "Coupon"}, //券的类型
  branch: {type: String, ref: "Branch"}, //所属门店、支行
  company: {type: String, ref: "Company"}, //所属公司信息
  noGain: {type: Number, default: 0},//未领取
  gain: {type: Number, default: 0},//已领取
  used: {type: Number, default: 0},//已使用
  total: {type: Number, default: 0},//总数量

}, {timestamps: {}});

module.exports = mongoose.model('CouponStat', CouponStatSchema,'couponStats');
