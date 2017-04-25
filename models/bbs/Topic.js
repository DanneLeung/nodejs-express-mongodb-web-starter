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
  comments: [{ type: ObjectId, ref: 'Comment' }], //评论
  commentCount: { type: Number, default: 0 }, //评论条数
  likeCount: { type: Number, default: 0 }, //评论条数
  heartCount: { type: Number, default: 0 }, //收藏条数
  top: { type: Boolean, default: false }, //置顶
  hot: { type: Boolean, default: false }, //热帖
  essence: Boolean,
  weight: Number, //权重，可以排序
  status: Number,
  blocked: { type: Boolean, default: false } //屏蔽
}, { timestamps: {} });
TopicSchema.statics = {
  toggleBoolField: function (id, field, done) {
    var updata = {};
    var options = { new: true };
    Topic.findOne({
      '_id': id
    }, function (err, topic) {
      if(err) {
        console.error(err);
        return done(err, null);
      }
      if(topic) {
        topic[field] = !topic[field];
        topic.save((err, topic) => {
          return done(err, topic);
        });
      } else {
        return done(err, topic);
      }
    });
  },
  incsCountField: function (id, field, done) {
    var update = {};
    update[field] = 1;
    Topic.update({ _id: id }, { $inc: update }, (err, result) => {
      if(err) console.error(err);
      done(err, result);
    });
  },
  topTopics: function (node, done) {
    var q = { top: true };
    if(node) q.node = node;
    Topic.find(q).sort("-updatedAt").populate("fans user").exec((err, topics) => {
      if(err) console.error(err);
      done(topics);
    });
  },
  topicsWithNode: function (node, offset, limit, done) {
    var q = {
      blocked: false,
      $or: [{ top: false }, { top: { $exists: false } }]
    };
    if(node) q.node = node;
    Topic.find(q).populate("node fans user").sort("-createdAt").skip(offset).limit(limit).exec((err, topics) => {
      if(err) console.error(err);
      done(topics);
    });
  },
  topicsWithFans: function (fansId, offset, limit, done) {
    Topic.find({ fans: fansId, blocked: false }).populate("node fans user").sort("-createdAt").skip(offset).limit(limit).exec((err, topics) => {
      if(err) console.error(err);
      done(topics);
    });
  }
}
var Topic = mongoose.model('Topic', TopicSchema, 'topics')
module.exports = Topic;