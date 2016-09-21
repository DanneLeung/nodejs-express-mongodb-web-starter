/**
 * 商品属性数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ProductAttributeSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},//id
  channel: {type: ObjectId, ref: 'Channel'},//所属渠道
  store: {type: ObjectId, index: true, ref: 'Store'}, //店铺名称,暂时一个渠道只有一个店铺
  group: {type: String, ref: 'ProductAttributeGroup'},//商品属性组，相同名称分组
  name: {type: String, required: true, default: ''},//商品属性名称
  description: {type: String, default: ''},//商品属性描述
  sort: {type: Number, default: 0,index:true}//显示排序
}, {timestamps: {}});

var ProductAttribute = mongoose.model('ProductAttribute', ProductAttributeSchema, 'productattributes');
module.exports = ProductAttribute;