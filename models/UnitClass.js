/**
 * 单位数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let UnitClassSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},//id
  channel: {type: ObjectId, ref: 'Channel'},//所属渠道
  title: {type: String, required: true, default: ''},//标题
  type: {type: String, required: true, default: ''},//单位类型 length：长度单位 、weight：重量单位
  unit: {type: String, default: ''},//单位
  value: {type: Number, default: 0,index:true}//单位值
}, {timestamps: {}});

var UnitClass = mongoose.model('UnitClass', UnitClassSchema, 'unitclass');
module.exports = UnitClass;
