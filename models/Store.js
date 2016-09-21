/**
 * 店铺
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var StoreSchema = mongoose.Schema({
  name: {type: String, required: true, default: ""},     //店铺名称
  href: {type: String, required: true, default: ""},     //店铺地址
  companyName: {type: String, trim: true, default: ""},     //公司名称
  payMode: [{type: String, default: ""}],     //支付模式
  descScore: {type: String, default: ""},     //描述相符 星级评分(总共5星)
  serviceScore: {type: String, default: ""},  //服务态度 星级评分(总共5星)
  shipScore: {type: String, default: ""},     //发货速度 星级评分(总共5星)
  scoreDesc: {type: String, trim: true, default: ""},     //商铺描述
  phone: {type: String, trim: true, default: ""},     //客服电话
}, {timestamps: {}});

module.exports = mongoose.model('Store', StoreSchema, 'stores');