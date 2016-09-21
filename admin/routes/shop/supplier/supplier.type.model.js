/**
 * Created by xingjie201 on 2016/2/18.
 * 供应商类型
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var SupplierTypeSchema = mongoose.Schema({
    _id:{type:String,default:ShortId.generate},
    channel: {type: ObjectId, ref: "Channel"}, //渠道
    name: {type: String, required: true,  default: ''}, //类别名称
    instruction: {type: String, required: true,  default: ''}, // 类别介绍
    note: {type: String,  default: ''} // 备注
}, {timestamps: {}});

module.exports = mongoose.model('SupplierType', SupplierTypeSchema, 'supplierTypes');
