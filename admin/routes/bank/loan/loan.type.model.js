/**
 * 贷款产品分类
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var LoanTypeSchema = mongoose.Schema({
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  parent: { type: ObjectId, ref: 'LoanType' },//上级分类
  name: { type: String, required: true, default: '' }, //名称
  type: {type: String, required: true, default: '' }, //类型名称
  description: { type: String }, //描述
  logo: { type: String }, //图标
  icon: {type: String },//列显示图标
  slide: { type: String, ref: 'Slide' }, //轮播图片,进入某个分类时，有轮播则显示轮播
  sort: { type: Number, default: 0 }, //显示排序
  enabled: { type: Boolean, default: false } //激活使用
}, { timestamps: {} });

var LoanType = mongoose.model('LoanType', LoanTypeSchema, 'loantypes');
module.exports = LoanType;
