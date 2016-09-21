/**
 * 记录主动发送给粉丝的消息
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var WechatSendMessageSchema = new Schema({
  channel: {type: ObjectId, ref: 'Channel'},
  wechat: {type: ObjectId, ref: 'ChannelWechat'},
  fans: {type: ObjectId, ref: 'WechatFans'},
  originalId: {type: String, default: ''},	//开发者微信号,originalId
  openid: {type: String, default: ''},		//发送方帐号（一个OpenID）
  msgType: {type: String, default: ''},		//消息类型
  content: {type: String, default: ''},		//文本消息内容
  picUrl: {type: String, default: ''},		//图片链接
  mediaId: {type: String, default: ''},		//媒体id，可以调用多媒体文件下载接口拉取数据。
  thumbMediaId: {type: String, default: ''},		//视频消息缩略图的媒体id，可以调用多媒体文件下载接口拉取数据。
  format: {type: String, default: ''},		//语音格式，如amr，speex等
  title: {type: String, default: ''},		//消息标题
  description: {type: String, default: ''},		//消息描述
  url: {type: String, default: ''},		//消息链接
  msgId: {type: String},		//消息id，64位整型
}, {timestamps: {}});

module.exports = mongoose.model('WechatSendMessage', WechatSendMessageSchema, 'wechatSendMessages');
