/**
 * 客户公司信息
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');
var CompanySchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  shortname: {type: String, default: ''}, //姓名
  fullname: {type: String, default: ''}, //姓名
  tel: {type: String, default: ''}, //电话
  email: {type: String, default: ''}, // 邮箱
  address: {type: String, default: ''}, // 地址
  logo: {type: String, default: ''}, // 图标
  bgimg: {type: String, default: ''}, // 图标
  description: {type: String, default: ''}, // 说明
  enabled: {type: Boolean, default: true}, // 使用，禁用时设false
  settings: [] //设定值
}, {timestamps: {}});

CompanySchema.index({channel: 1, fullname: 1}, {unique: true});

CompanySchema.statics.findByFullName = function (fullname, callback) {
  mongoose.model('Company').findOne({
    fullname: fullname
  }).exec(function (err, company) {
    callback(err, company);
  });
};

module.exports = mongoose.model('Company', CompanySchema, 'companies');
