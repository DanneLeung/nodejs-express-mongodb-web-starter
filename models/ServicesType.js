/**
 * Created by xingjie201 on 2016/2/18.
 * 供应商model
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var ServicesTypeSchema = mongoose.Schema({
    name: {type: String, required: true,  default: ''}, //服务类别名称
    instruction: {type: String, required: true,  default: ''}, // 服务类别介绍
    note: {type: String,  default: ''} // 备注
}, {timestamps: {}});

module.exports = mongoose.model('ServicesType', ServicesTypeSchema, 'servicesTypes');
