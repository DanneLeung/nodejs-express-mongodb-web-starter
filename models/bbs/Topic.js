/**
 * BBS论坛话题帖子
 */
'use strict';

let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let TopicSchema = new Schema({
  node: { type: ObjectId, ref: 'Node' },
  user: { type: ObjectId, ref: 'User' },
  fans: { type: ObjectId, ref: 'WechatFans' },
  title: { type: String, default: '' }, //分类名称，
  content: { type: String, default: '' }, //描述
  images:[], //图片
  top: Boolean,
  essence: Boolean,
  weight: Number,
  status: Number,
  blocked: { type: Boolean, default: false } //屏蔽
});

var Topic = mongoose.model('Topic', TopicSchema, 'topics')
module.exports = Topic;