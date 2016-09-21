/**
 * 商品属性数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ProductAttributeGroupSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},//id
  channel: {type: ObjectId, ref: 'Channel'},//所属渠道
  store: {type: ObjectId, index: true, ref: 'Store'}, //店铺名称,暂时一个渠道只有一个店铺
  name: {type: String, required: true, default: ''},//商品属性组名称
  description: {type: String, default: ''},//商品属性组描述
  sort: {type: Number, default: 0,index:true}//显示排序
}, {timestamps: {}});

var ProductAttributeGroup = mongoose.model('ProductAttributeGroup', ProductAttributeGroupSchema, 'productattributegroups');
module.exports = ProductAttributeGroup;