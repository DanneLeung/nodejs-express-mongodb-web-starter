/**
 * BBS论坛评论
 */
'use strict';

let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let TopicLikeSchema = new Schema({
  topic: { type: ObjectId, ref: 'Topic' },
  user: { type: ObjectId, ref: 'User' },
  fans: { type: ObjectId, ref: 'WechatFans' },
  like: { type: Boolean, default: true }
}, { timestamps: {} });
var TopicLike = mongoose.model('TopicLike', TopicLikeSchema, 'topiclikes');
module.exports = TopicLike;