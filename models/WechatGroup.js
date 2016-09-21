/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * wechat fans group Schema
 */
var WechatGroupSchema = new Schema({
  id: ObjectId,
  channelWechat: {type: ObjectId, index: true, ref: 'ChannelWechat'}, //渠道下的公众号
  name: {type: String, trim: true, default: ""},
  groupId: {type: String, trim: true, default: ""},
  description: {type: String, trim: true, default: ""},
  count: {type: Number, default: 0}
}, {timestamps: {}});

WechatGroupSchema.methods = {};
var WechatGroup = mongoose.model('WechatGroup', WechatGroupSchema, 'wechatgroups');
