/**
 * Module dependencies.
 * 微信模板消息
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * wechat fans group Schema
 */
var WechatMsgTemplateSchema = new Schema({
  channelWechat: {type: ObjectId, index: true, ref: 'ChannelWechat'}, //渠道下的公众号
  templateId: {type: String, trim: true, default: ""},//模板消息ID
  title: {type: String, trim: true, default: ""},//标题
  primaryIndustry: {type: String, trim: true, default: ""},//一级行业
  deputyIndustry: {type: String, trim: true, default: ""},//二级行业
  content: {type: String, trim: true, default: ""},//消息内容
  example: {type: String, trim: true, default: ""}//例子
}, {timestamps: {}});

WechatMsgTemplateSchema.methods = {};
var WechatMsgTemplate = mongoose.model('WechatMsgTemplate', WechatMsgTemplateSchema, 'wechatMsgTemplates');
