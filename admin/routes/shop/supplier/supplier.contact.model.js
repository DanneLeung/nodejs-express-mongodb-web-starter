/**
 * Created by xingjie201 on 2016/2/18.
 * 联系人model（供应商）
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');


var SupplierContactSchema = mongoose.Schema({
  _id:{type:String,default:ShortId.generate},
  name: {type: String, required: true, default: ''}, //姓名
  tel: {type: String, required: true, default: ''}, //电话
  title: {type: String, required: false, default: ''}, // 职称
  email: {type: String, required: false, default: ''}, // 邮箱
  note: {type: String, default: ''}, // 说明备注
  supplier: {type: String, ref: 'Supplier'} // 供应商ID
}, {timestamps: {}});

module.exports = mongoose.model('SupplierContact', SupplierContactSchema, 'SupplierContact');
