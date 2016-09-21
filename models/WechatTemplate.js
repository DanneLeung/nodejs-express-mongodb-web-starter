/**
 * 渠道关联的站点模板
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var WechatTemplateSchema = mongoose.Schema({
  channel: {type: ObjectId, ref: "Channel"}, //渠道，为空时属于系统全局
  template: {type: ObjectId, ref: "Template"}, //类型
  enabled: {type: Boolean, required: true, default: true}, // 可用
  // setting
  params: [{type: String, default: ''}]
},{timestamps:{}});

module.exports = mongoose.model('WechatTemplate', WechatTemplateSchema, 'wechatTemplates');
