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
  images: [], //图片
  readCount: { type: Number, default: 0 }, //阅读次数
  commentCount: { type: Number, default: 0 }, //评论条数
  likeCount: { type: Number, default: 0 }, //评论条数
  heartCount: { type: Number, default: 0 }, //评论条数
  top: Boolean, //置顶
  essence: Boolean,
  weight: Number, //权重，可以排序
  status: Number,
  blocked: { type: Boolean, default: false } //屏蔽
}, { timestamps: {} });
TopicSchema.statics = {
  incsReadCount: function (id, done) {
    Topic.update({ _id: id }, { $set: { readCount: { $inc: 1 } } }, (err, result) => {
      if(err) console.error(err);
      done(result);
    });
  },
  topicsWithNode: function (node, offset, limit, done) {
    var q = {};
    if(node) q.node = node;
    Topic.find(q).populate("fans user").sort("top -createdAt").skip(offset).limit(limit).exec((err, topics) => {
      if(err) console.error(err);
      done(topics);
    });
  }
}
var Topic = mongoose.model('Topic', TopicSchema, 'topics')
module.exports = Topic;