/**
 * 检索有效的商品ID
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var ProductIdsSchema = mongoose.Schema({
    no :{ type: String, required: true, default: "" },     //商品编号
    url :{ type: String, required: true, default: "" },     //产品链接
    flag :{ type: String, required: true, default: "0" },     //处理标记
}, {timestamps: {}});

module.exports = mongoose.model('ProductIds', ProductIdsSchema, 'productIds');