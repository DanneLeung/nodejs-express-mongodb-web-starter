/**
 * 商品数据模型
 */
'use strict';
let mongoose = require('mongoose');
let ShortId = require('shortid');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ProductSchema = mongoose.Schema({
    _id: {type: String, default: ShortId.generate},//id
    channel: {type: ObjectId, ref: 'Channel'},//所属渠道
    store: {type: ObjectId, index: true, ref: 'Store'}, //店铺名称,暂时一个渠道只有一个店铺
    category: {type: String, trim: true, ref: 'ProductCategory'},     //商品分类
    brand: {type: String, ref: 'Brand'},
    no: {type: String, default: ''},     //商品店内编号
    name: {type: String, required: true, default: ''},//商品名称
    model: {type: String, required: true, index: true, default: ''},//商品型号
    upc: {type: String, index: true, default: ''},//UPC编码
    ean: {type: String, index: true, default: ''},//EAN编码
    jan: {type: String, index: true, default: ''},//JAN编码
    isbn: {type: String, index: true, default: ''},//ISBN编码（书）
    description: {type: String, default: ''},//商品简述，用于副标题
    text: {type: String, default: ''},//商品详情
    tag: {type: String, default: ''},//商品标签
    price: {type: Number, default: 0},  //售价
    points: {type: Number, default: 0},  //购买得积分
    getByPoints: {type: Number, default: 0},  //积分购买所需总积分
    quantity: {type: Number, default: 0}, //库存余量
    substract: {type: Boolean, default: true}, //是否需要减库存
    shipping: {type: Boolean, default: true}, //是否需要配送
    location: {type: String, default: ''},//生产地
    url: {type: String, default: ''},     //产品链接
    thumbImage: {type: String, default: ''},     //产品主图，用于显示缩略图
    images: [{type: String, default: ''}],//产品图库，可以用于轮播
    options: [{type: String, ref: 'ProductOption'}],
    attributes: [{
      group: {type: String, ref: 'ProductAttributeGroup'},
      attrs: [{
        attr: {type: String, ref: 'ProductAttribute'},
        value: {type: String, default: ''}
      }]
    }],//属性列表
    size: {//尺寸
      lengthClass: {type: String, ref: 'UnitClass'},//长度单位
      length: {type: Number, default: 0},//长
      width: {type: Number, default: 0},//宽
      height: {type: Number, default: 0}//高
    },
    weight: {//重量
      weightClass: {type: String, ref: 'UnitClass'}, //重量单位
      weight: {type: Number, default: 0}
    },
    enabled: {type: Boolean, default: true}, //可用
    avaliable: {type: Boolean, default: false},
    date_avaliable: {type: Date, default: ""} //上架时间
  }, {timestamps: {}}
);

let Product = mongoose.model('Product', ProductSchema, 'products');
module.exports = Product;
