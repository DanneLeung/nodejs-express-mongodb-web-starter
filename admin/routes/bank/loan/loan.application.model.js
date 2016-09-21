/**
 * 贷款产品申请数据模型
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var LoanApplicationSchema = mongoose.Schema({
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  loan: [],// 申请的贷款产品
  user: {
    openId: { type: String, required: true, default: "" },    //openId
    headimgurl: { type: String, trim: true },
    nickName: { type: String, required: false, default: "" },
    mobile: { type: String, required: false, default: "" },
    name: {type: String, required: false, default: "" }
  },
  company: {type: String, required: false, default: ""},    //公司名称
  fields: [],//自定义字段
  time: { type: Date, default: new Date() }
}, { timestamps: {} });

var LoanApplication = mongoose.model('LoanApplication', LoanApplicationSchema, 'loanapplications');
module.exports = LoanApplication;
