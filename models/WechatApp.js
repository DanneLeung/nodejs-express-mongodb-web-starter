/**
 * 微信号关联的应用
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var WechatAppSchema = new Schema({
  _id: { type: String, default: ShortId.generate },
  channel: { type: ObjectId, ref: 'Channel' },
  wechat: { type: ObjectId, ref: 'Wechat' },
  app: { type: String, ref: 'App' },
  url: { type: String, default: '' }, //访问url
  qrcode: { type: String, default: '' }, //url生产的二维码
  enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('WechatApp', WechatAppSchema, 'wechatapps');
