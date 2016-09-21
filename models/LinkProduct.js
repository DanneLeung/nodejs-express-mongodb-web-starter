/**
 * 外链商品数据模型
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var LinkProductSchema = mongoose.Schema({
  channel: {type: ObjectId, ref: 'Channel'},//所属渠道
  store: {type: ObjectId, index: true, ref: 'Store'},     //店铺名称
  no: {type: String, required: true, index: true, default: ''},     //商品编号
  name: {type: String, required: true, default: ''},     //商品名称
  category: {type: String, trim: true, default: ''},     //商品分类
  activityType: {type: String, required: true, default: ''},     //活动类型 fp:限时抢购 pd:满减
  queryTime: {type: Date, default: Date.now},     //筛选时间
  startDate: {type: Date},     //活动开始日期
  endDate: {type: Date},     //活动结束日期
  price: {type: Number, default: 0},     //商城价
  activityPrice: {type: Number, default: 0},     //活动价
  diffPrice: {type: Number, default: 0},     //差价
  activityPriceDesc: {type: String, default: ''},     //活动价描述(如满立减：满300减30元，最高减300元)
  evaScore: {type: String, default: ''},     //描述相符
  stockNum: {type: Number, default: 0},     //库存余量
  monthSalesNum: {type: Number, default: 0},     //月销量
  url: {type: String, required: true, default: ''},     //产品链接
  thumbImg: {type: String, required: true, default: ''},     //产品主图，用于显示缩略图
  smallImgs: [{type: String, required: true, default: ''}],   //小图片链接
  middleImgs: [{type: String, trim: true, default: ''}],  //中图片链接
  bigImgs: [{type: String, required: true, default: ''}],     //大图片链接
  detailImgs: [{type: String, required: true, default: ''}],     //明细图片链接
}, {timestamps: {}});


module.exports = mongoose.model('LinkProduct', LinkProductSchema, 'linkproducts');