/**
 * 问题库
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var _ = require("lodash");

var QuizPoolSchema = mongoose.Schema({
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道，渠道内部公众号间共享
  name: { type: String, required: false, default: '' }, //题库名称
  description: { type: String, required: false, default: '' }, //题库说明
  quizs: [{ type: ObjectId, ref: 'Quiz' }], //指定题目
  count: { type: Number, default: 10 }, //问题数
  enabled: { type: Boolean, default: false } //激活
}, {timestamps: {}});

QuizPoolSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('QuizPool')
    .findOne({
      name: that.name,
      channel: that.channel
    }, function (err, site) {
      if (err) {
        done(err);
      } else if (site && !(site._id.equals(that._id))) {
        that.invalidate('name', '活动名称必须唯一');
        done(new Error('活动名称必须唯一'));
      } else {
        done();
      }
    });
});

QuizPoolSchema.statics = {
  quizs: function (id, done) {
    mongoose.model('QuizPool').findById(id, function (err, pool) {
      pool.populate('quizs', function (err, r) {
        done(r.quizs);
      });
    });
  },
  addQuizs: function (id, quizIds, done) {
    mongoose.model('QuizPool').findById(id, function (err, pool) {
      //权限先合并再排除相同值的权限id
      pool.quizs = _.uniq(_.union(pool.quizs, quizIds), function (p) {
        //字符串比较
        return p + "";
      });
      pool.save(function (err, pool) {
        done(err, pool);
      });
    });
  },
  revokeQuizs: function (id, quizIds, done) {
    mongoose.model('QuizPool').findById(id, function (err, pool) {
      console.log("final quizs:\n" + quizIds);
      // 去除选择解除权限的权限ID
      pool.quizs = _.remove(pool.quizs, function (n) {
        var idx = quizIds.some(function (p) {
          //字符串比较
          return p == n + "";
        });
        return !(quizIds == n + "" || idx);
      });
      pool.save(function (err, pool) {
        done(err, pool);
      });
    });
  }
}

module.exports = mongoose.model('QuizPool', QuizPoolSchema, 'quizpools');
