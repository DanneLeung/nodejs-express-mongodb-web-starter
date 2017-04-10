/**
 * 系统模版,主题
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');


var TemplateSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  type: {type: String, required: false, default: ""}, //类型
  name: {type: String, required: true, default: ""}, //名称
  thumb: {type: String, default: ""}, //缩略图
  directory: {type: String, default: ""}, //所在目录
  description: {type: String, default: ""},  // 详细描述`
  version: {type: String, default: "1.0.0"}, // 可用
  enabled: {type: Boolean, default: true}, // 可用
  // 设置参数
  params: [{name: String, label: String, value: String}]
}, {timestamps: {}});

module.exports = mongoose.model('Template', TemplateSchema, 'templates');
