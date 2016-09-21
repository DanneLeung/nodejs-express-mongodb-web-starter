/**
 * 商品SKU数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ProductSkuSchema = mongoose.Schema({
    _id: {type: String, default: ShortId.generate},//id
    channel: {type: ObjectId, ref: 'Channel'},//所属渠道
    store: {type: ObjectId, index: true, ref: 'Store'}, //店铺名称,暂时一个渠道只有一个店铺
    product: {type: String, trim: true, ref: 'Product'},     //商品分类
    sku: {type: String, trim: true},     //商品SKU编码
    options: [{type: String, ref: 'ProductOptionValue'}],
    quantity: {type: Number, default: 0},//数量
    price: {type: Number, default: 0},//加减价格值
    points: {type: Number, default: 0},//加减积分值
    weight: {type: Number, default: 0},//加减重量值
    substract: {type: Boolean, default: true},//减库存
    attributes: [{//覆盖产品属性
      group: {type: String, ref: 'ProductAttributeGroup'},
      attrs: [{
        attr: {type: String, ref: 'ProductAttribute'},
        value: {type: String, default: ''}
      }]
    }],//属性列表
    date_avalible: {type: Date},//上架日期，时间
    thumbImage: {type: String, default: ''}, //产品主图，用于显示缩略图，如果有，覆盖产品缩略图
    images: [{}]//产品图库，可以用于轮播，如果有，覆盖产品轮播图
  }, {timestamps: {}}
);

let ProductSku = mongoose.model('ProductSku', ProductSkuSchema, 'productskus');
module.exports = ProductSku;
