/**
 * 检索有效商品ID的标志位
 */
//初始化数据
/*{
    "_id" : ObjectId("56f0f90c42ef5b0c2f1eb394"),
    "createdAt" : ISODate("2016-03-22T07:49:32.671Z"),
    "updatedAt" : ISODate("2016-03-22T07:49:32.671Z"),
    "count" : 1,
    "__v" : 0
}*/


"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var ProductIdCountSchema = mongoose.Schema({
    count :{ type: Number, required: true},     //检索标志位
    type :{ type: String, required: true},     //类型 total:筛选总商品数 fetch:从商品列表筛选有用商品
}, {timestamps: {}});

module.exports = mongoose.model('ProductIdCount', ProductIdCountSchema, 'productIdCounts');