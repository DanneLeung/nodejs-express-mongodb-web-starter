/**
 * Created by xingjie201 on 2016/2/18.
 * 供应商model
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var SupplierSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  name: {type: String, required: true, default: ''}, //姓名
  channel: {type: ObjectId, ref: "Channel"}, //渠道
  type: {type: String, ref: 'SupplierType'}, //供应商类别
  begin: {type: Date, required: true, default: new Date}, //合作开始时间
  end: {type: Date, required: true, default: new Date}, // 合作结束时间
  level: {type: String, required: true, default: 1}, // 星级(1、2、3、4、5星级)
  tags: [{type: String, default: ''}], // 标签
  enabled: {type: Boolean, trim: true, default: true} // 是否激活
}, {timestamps: {}});

module.exports = mongoose.model('Supplier', SupplierSchema, 'supplies');
