/**
 * 商品可选项数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ProductOptionSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},//id
  channel: {type: ObjectId, ref: 'Channel'},//所属渠道
  store: {type: ObjectId, index: true, ref: 'Store'}, //店铺名称,暂时一个渠道只有一个店铺
  name: {type: String, required: true, default: ''},//商品名称
  type: {type: String, default: ''}, //输入类型，Checkbox，Radio，Select， Text
  description: {type: String, default: ''},//描述
  sort: {type: Number, default: 0},//显示排序
  enabled: {type: Boolean, default: true} //可用

}, {timestamps: {}});

ProductOptionSchema.statics = {
  getType: function (callback) {
    var types = [{'code': 'Checkbox', 'name': '多选'},
      {'code': 'Radio', 'name': '单选'},
      {'code': 'Select', 'name': '下拉'},
      {'code': 'Text', 'name': '文本'}];
    callback(null, types);
  }
}

var ProductOption = mongoose.model('ProductOption', ProductOptionSchema, 'productoptions');
module.exports = ProductOption;
