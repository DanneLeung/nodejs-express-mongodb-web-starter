/**
 * BBS论坛评论
 */
'use strict';

let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let CommentSchema = new Schema({
  topic: { type: ObjectId, ref: 'Topic' }, //帖子
  toComment: { type: ObjectId, ref: 'Comment' }, //评论的评论回复
  user: { type: ObjectId, ref: 'User' },
  fans: { type: ObjectId, ref: 'WechatFans' },
  content: { type: String, default: '' }, //描述
  images: [], //图片
  hot: Boolean, // 热门评论
  blocked: { type: Boolean, default: false } //屏蔽
}, { timestamps: {} });

CommentSchema.statics = {
  commentsByTopicId: function (topicid, offset, limit, done) {
    if(!offset) offset = 0;
    if(!limit) limit = 5;
    Comment.find({ topic: topicid }).populate("fans user").sort('-createdAt').skip(offset).limit(limit).exec(done);
  }
}

var Comment = mongoose.model('Comment', CommentSchema, 'comments')
module.exports = Comment;