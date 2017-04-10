/**
 * CMS文章，HTML
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var ContentSchema = new Schema({
  _id: { type: String, default: ShortId.generate },
  category: { type: String, ref: 'CmsCategory' }, //文章分类
  template: { type: String, ref: 'Template' }, //模板
  params: [{ name: String, label: String, value: String }],
  tags: { type: String, default: '' }, //标签，
  content: { type: String, default: '' }, //详细内容，html格式
  keywords: { type: String, default: '' }, //关键字
  title: { type: String, default: '' }, //名称
  description: { type: String, default: '' }, //描述
  author: { type: String, default: '' }, //作者
  logo: { type: String, default: '' }, //图标
  url: { type: String, default: '' }, //访问url
  point: { type: Number, default: 0 },//阅读得积分
  reading: {
    total: { type: Number, default: 0 },
    today: { type: Number, default: 0 }
  },//阅读次数
  version: { type: String, default: '' }, //版本号，修改版本
  publishedAt: { type: Date }, //发表日期
  enabled: { type: Boolean, default: true } //发表
});

/**
 * 阅读次数增加
 */
ContentSchema.statics.read = function (id, callback) {
  Content.updateById(id, { $inc: { 'reading.total': 1 } }, function (result) {

  });
}
var Content = mongoose.model('Content', ContentSchema, 'contents');
module.exports = Content;
