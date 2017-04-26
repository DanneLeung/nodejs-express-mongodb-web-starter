/**
 * BBS论坛评论
 */
'use strict';

let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let TopicLikeSchema = new Schema({
  topic: { type: ObjectId, ref: 'Topic', index: true },
  user: { type: ObjectId, ref: 'User' },
  fans: { type: ObjectId, ref: 'WechatFans', index: true },
  like: { type: Boolean, default: true }
}, { timestamps: {} });

TopicLikeSchema.statics = {
  likeTopic: function (topicId, fansId, done) {
    TopicLike.findOne({ topic: topicId, fans: fansId }).exec((err, like) => {
      if(err) console.error(err);
      if(like) {
        return done(true, "已经点过赞了!");
      } else {
        TopicLike.findOneAndUpdate({ topic: topicId, fans: fansId }, { topic: topicId, fans: fansId, like: true }, { new: true, upsert: true }, (err, like) => {
          if(err) console.error(err);
          if(like) {
            mongoose.model("Topic").incsCountField(topicId, "likeCount", (err, result) => {
              console.log(" >>>>>>>>>>>>>> ", result);
              if(err) console.error(err);
              if(result.nModified)
                return done(false, "点赞成功!");
              else
                return done(true, "抱歉,好像发生了错误!");
            });
          } else {
            return done(true, "抱歉,好像发生了错误!");
          }
        });
      }
    });
  }
}
var TopicLike = mongoose.model('TopicLike', TopicLikeSchema, 'topiclikes');
module.exports = TopicLike;