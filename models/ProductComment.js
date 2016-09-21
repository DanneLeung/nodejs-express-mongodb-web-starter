/**
 * 商品评价数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ProductCommentSchema = mongoose.Schema({
  product: {type: ObjectId, ref: 'Product'},//商品
  member: {type: ObjectId, ref: 'Member'},//所属会员
  order: {type: String, ref: 'Order'},//关联订单
  stars: {type: String, default: ''},//评星级
  comment: {type: String, default: ''},//评价内容
  display: {type: Boolean, default: true}//是不显示
}, {timestamps: {}});

var ProductComment = mongoose.model('ProductComment', ProductCommentSchema, 'productcomments');
module.exports = ProductComment;
