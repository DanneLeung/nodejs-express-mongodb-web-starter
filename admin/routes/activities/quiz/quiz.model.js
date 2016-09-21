/**
 * 问答闯关问题
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var QuizSchema = mongoose.Schema({
  quizPool: {type: ObjectId, ref: "QuizPool"}, //题库
  title: {type: String, required: true, default: ''}, //标题
  description: {type: String, default: ''}, //问题描述
  multi: {type: Boolean, default: false}, //多选题
  level: {type: Number, default: 1}, //难度，从1开始，值越大难度越大，适配到游戏中便是关卡
  score: {type: Number, default: 1}, //答对所得默认分值，1 ~ 100
  options: [{
    title: {type: String, required: true, default: ''},
    answer: Boolean //问题答案，用户选择这项则表示答对
  }], //题目选项
  enabled: {type: Boolean, default: true} //可用
});

QuizSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Quiz')
    .findOne({
      title: that.title,
      quizPool: that.quizPool
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

module.exports = mongoose.model('Quiz', QuizSchema, 'quizs');
