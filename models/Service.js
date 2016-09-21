/**
 * Created by xingjie201 on 2016/2/18.
 * 供应商model
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;



var ServiceSchema = mongoose.Schema({
    name: {type: String, required: true, default: ''}, //姓名
    servicesTypeId: {type: ObjectId, ref: 'ServicesType'}, //供应商类别
    serviceBegin: {type: Date, required: true,  default: new Date}, //合作开始时间
    serviceEnd: {type: Date, required: true,  default: new Date}, // 合作结束时间
    level: {type: String, required: true,  default: ''}, // 星级(1、2、3、4、5星级)
    tags: [{type: String,  default: ''}], // 标签
    enabled: {type: Boolean, trim: true, default: true} // 是否激活
}, {timestamps: {}});

module.exports = mongoose.model('Service', ServiceSchema, 'services');
