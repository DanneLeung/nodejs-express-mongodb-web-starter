/**
 * 外链商品发布站点设置，渠道默认只有一个外链商品站点
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var LinkProductSiteSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  channel: {type: ObjectId, ref: 'Channel'},//所属渠道
  title: {type: String, default: ''},//站点标题
  footer: {type: String, default: ''},//站点footer版权等声明文字
  slides: [{//幻灯片轮播
    title: {type: String},//图片标题
   // image: {type: String},//图片本地相对路径，上传的图片，生成imageUrl
    imageUrl: {type: String},//图片远程url，引用外部图片时直接完整URL
    link: {type: String, default: ''}//图片点击链接
    //sort: {type: Number, default: 0}//排序，也可以按照数组顺序
  }],
  releases: [{type: ObjectId, ref: 'LinkProductRelease'}],//外链商品发布数组，选择已发布
  online: {type: Boolean, default: true},//站点上线
  offlineText: {type: String, default: '站点维护中，请稍后再试!'}
}, {timestamps: {}});


module.exports = mongoose.model('LinkProductSite', LinkProductSiteSchema, 'linkproductsite');