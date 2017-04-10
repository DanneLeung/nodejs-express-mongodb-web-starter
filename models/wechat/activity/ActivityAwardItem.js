/**
 * 活动奖品明细数据及库存模型
 */
'use strict';
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var AwardItemSchema = new Schema({
  award: {type: ObjectId, index: true, ref: "Award"}, //使用的微信号
  stock: {type: Number, default: 1}, //库存数量，默认库存1，虚拟商品兑换码一类，每个码一个库存记录
  no: {type: String, default: '',index:true},//编号
  code: {type: String, default: ''},//密码，兑换号
  type: {type: String, default: ''},//类型
  note: {type: String, default: ''},//备注
  price: {type: Number, default: 0}, //面值
  startTime: {type: Date},//有效时间开始
  endTime: {type: Date},//有效时间结束
  taken: {type: Boolean, default: false},
  status: {type: String, default: ''},
  otherId: {type: String, default: ''},//第三方系统识别id
  toVoid:{type: Boolean, default: false}
  //参数规格
}, {timestamps: {}});

module.exports = mongoose.model('AwardItem', AwardItemSchema, 'activityawarditem');
