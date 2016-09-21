/**
 * 券发行和兑换模型
 */

'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var CouponListSchema = new Schema({
  id: ObjectId,
  channel: {type: ObjectId, ref: "Channel"},//渠道
  coupon: {type: ObjectId, ref: "Coupon"},//券发行数据
  company: {type: String, ref: "Company"},//公司信息
  companyName: {type: String, default: ""},//公司信息
  no: {type: String, default: ''},//券号
  code: {type: String, default: ''},//券编码
  member: {type: ObjectId, ref: "Member"},//领取的会员，如果有会员则关联
  value: {type: Number, default: 0},//面值
  price: {type: Number, default: 0},//售价，可能需要使用支付换券
  needScore: {type: Number, default: 0},//所兑换积分数
  publishTime: {type: Date},//发行时间
  getTime: {type: Date},//领券时间
  activateTime: {type: Date},//激活时间
  usedTime: {type: Date},//使用时间
  usedOrderNo: {type: String, default: ''},//应用的订单号
  avaliabeBegin: {type: Date},//有效时间开始
  avaliabeEnd: {type: Date},//有效时间结束
  enabled: {type: Boolean, default: true},//激活，作废时置false
  // disabled: {type: Boolean, default: false},
  fullname: {type: String, default: ''},  //领取人姓名
  mobile: {type: String, default: '', index: true},  //领取人手机号码，用手机号码领券，定向发行的优惠券领取前可能已经有领取人信息
  branch: {type: String, ref: "Branch"},  //所属支行
  branchName: {type: String, default: ''},  //所属支行名称
  getStatus: {type: String, default: '',index:true} // 获取券的状态 01：未获取  02：获取 03：已使用
}, {timestamps: {}});
CouponListSchema.index({coupon: 1, no: 1}, {unique: true});
CouponListSchema.index({coupon: 1, mobile: 1}, {unique: true});

module.exports = mongoose.model('CouponList', CouponListSchema, 'couponList');
