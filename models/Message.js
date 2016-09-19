/**
 * Created by yu869 on 2016/1/13.
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var MessageSchema = mongoose.Schema({
    key: {type: String, required: true,default:''},//系统设定名称
    value: {type: String, required: true,default:''},//系统设定值
    group:{type:String,required:true,default:''},//用于区分类别的关键字
    describe: {type: String,required:true, default: ''}//描述
}, {timestamps: {}});

module.exports = mongoose.model('Message', MessageSchema, 'messages');