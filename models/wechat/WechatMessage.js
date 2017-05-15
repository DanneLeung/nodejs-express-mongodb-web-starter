/**
 * 微信消息数据模型
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var WechatMessageSchema = new Schema({
  wechat: {type: ObjectId, ref: 'Wechat'},
  fans: {type: ObjectId, ref: 'WechatFans'},
  toUserName: {type: String, default: ''},	//开发者微信号,originalId
  fromUserName: {type: String, default: ''},		//发送方帐号（一个OpenID）
  createTime: {type: Number},	//消息创建时间 （整型）
  msgType: {type: String, default: ''},		//消息类型
  content: {type: String, default: ''},		//文本消息内容
  picUrl: {type: String, default: ''},		//图片链接
  mediaId: {type: String, default: ''},		//媒体id，可以调用多媒体文件下载接口拉取数据。
  thumbMediaId: {type: String, default: ''},		//视频消息缩略图的媒体id，可以调用多媒体文件下载接口拉取数据。
  format: {type: String, default: ''},		//语音格式，如amr，speex等
  title: {type: String, default: ''},		//消息标题
  description: {type: String, default: ''},		//消息描述
  url: {type: String, default: ''},		//消息链接
  location_X: {type: String, default: ''},		//地理位置x坐标
  location_Y: {type: String, default: ''},		//地理位置y坐标
  scale: {type: String, default: ''},		//地图缩放大小
  label: {type: String, default: ''},		//地图位置信息
  msgId: {type: String},		//消息id，64位整型
  keyword: {type: Boolean, default: false},//关键词
  tag: {type: Boolean, default: false},//收藏标记
  replyTag: {type: Boolean, default: false},//回复标记
  replyMsgs: []//回复消息内容
}, {timestamps: {}});

module.exports = mongoose.model('WechatMessage', WechatMessageSchema, 'wechatmessages');
