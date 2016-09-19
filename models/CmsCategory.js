/**
 * CMS文章分类
 */
'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ArticleCategorySchema = new Schema({
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道
  name: {type: String, default: ''}, //分类名称，
  description: {type: String, default: ''}, //描述
  icon: {type: String, default: ''}, //图标URL
  enabled: {type: Boolean, default: true} //可用
});

module.exports = mongoose.model('ArticleCategory', ArticleCategorySchema, 'articlecategories');
