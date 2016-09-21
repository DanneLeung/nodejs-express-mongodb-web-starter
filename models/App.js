/**
 * 平台应用数据模型，主要用于微信
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var AppSchema = new Schema({
  _id: { type: String, default: ShortId.generate },
  type: { type: String, default: '' }, //类型，分类，
  name: { type: String, default: '' }, //名称
  author: { type: String, default: '' }, //作者
  version: { type: String, default: '' }, //版本号
  description: { type: String, default: '' }, //描述
  text: { type: String, default: '' }, //详细
  logo: { type: String, default: '' }, //图标
  screenshots: { type: String, default: '' }, //截图等
  url: { type: String, default: '' }, //基本url，根据具体应用数据，会包含应用具体数据id
  enabled: { type: Boolean, default: true } //是否激活
});

module.exports = mongoose.model('App', AppSchema, 'apps');
