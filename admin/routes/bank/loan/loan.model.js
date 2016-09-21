/**
 * 贷款产品数据模型
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var LoanSchema = mongoose.Schema({
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  type: { type: ObjectId, required: true, ref: 'LoanType' }, //分类
  no: { type: String, default: '' }, //编号
  name: { type: String, required: true, default: '' }, //名称
  description: { type: String, required: false }, //简要描述
  text: { type: String, required: false }, //图文详情
  logo: { type: String }, //图标
  enabled: { type: Boolean, default: false } //激活使用
}, { timestamps: {} });

var Loan = mongoose.model('Loan', LoanSchema, 'loans');
module.exports = Loan;
