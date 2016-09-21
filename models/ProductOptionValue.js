/**
 * 商品可选项数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ProductOptionValueSchema = mongoose.Schema({
  _id: {type: ObjectId},//id
  option:{type:String,ref:"ProductOption"},
  name: String,//名称
  sort: {type: Number, default: 0},//显示排序
  enabled: {type: Boolean, default: true} //可用
}, {timestamps: {}});

var ProductOptionValue = mongoose.model('ProductOptionValue', ProductOptionValueSchema, 'productoptionvalues');
module.exports = ProductOptionValue;
