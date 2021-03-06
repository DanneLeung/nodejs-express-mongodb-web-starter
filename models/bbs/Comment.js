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
    if(!offset) offset = 0
    else offset = parseInt(offset);

    if(!limit) limit = 20
    else limit = parseInt(limit);
    Comment.find({ topic: topicid }).populate("fans user").sort('-createdAt').skip(offset).limit(limit).exec(done);
  },
  toggleBoolField: function (id, field, done) {
    var updata = {};
    var options = { new: true };
    Comment.findOne({
      '_id': id
    }, function (err, comment) {
      if(err) {
        console.error(err);
        return done(err, null);
      }
      if(comment) {
        comment[field] = !comment[field];
        comment.save((err, comment) => {
          return done(err, comment);
        });
      } else {
        return done(err, comment);
      }
    });
  },
  newComment(topicid, user, fans, content, images, done) {
    var comment = new Comment({ topic: topicid, user: user, fans: fans, content: content, images: images });
    comment.save((err, cm) => {
      mongoose.model("Topic").update({ _id: topicid }, { $set: { lastCommentTime: Date.now() }, $inc: { commentCount: 1 }, $push: { comments: { $each: [cm], $position: 0, $slice: 5 } } }, (err, t) => {
        if(err) console.error(err);
        console.log(" >>>>>>>>>>>>>>>>>>> topic comment ", t);
        return done(err, cm, t);
      });
    });
  }
}

var Comment = mongoose.model('Comment', CommentSchema, 'comments');
module.exports = Comment;