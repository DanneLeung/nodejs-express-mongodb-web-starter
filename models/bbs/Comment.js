/**
 * BBS论坛评论
 */
'use strict';

let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let CommentSchema = new Schema({
  topic: { type: ObjectId, ref: 'Topic' },
  user: { type: ObjectId, ref: 'User' },
  to: { type: ObjectId, ref: 'User' },
  content: { type: String, default: '' }, //描述
  blocked: { type: Boolean, default: false } //屏蔽
});

var Comment = mongoose.model('Comment', CommentSchema, 'comments')
module.exports = Comment;