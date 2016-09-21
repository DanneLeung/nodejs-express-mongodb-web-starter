/**
 * 用户答题结果
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var QuizAnswerSchema = mongoose.Schema({
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道
  quizRun: {type: String, ref: "QuizRun"}, //所属渠道，渠道内部公众号间共享
  user: {fullname: String, mobile: String, openid: String, nickname: String, unionid: String}, //作答者
  curr: {round: Number, level: Number}, //当前题目
  stopAtLevel: Number, //结束在关卡数
  startAt: {type: Date, default: Date.now()}, //答题开始时间
  finishAt: Date, //答题完成时间
  finished: {type: Boolean, default: false}, //闯关答题完成
  fail: {type: Boolean, default: false}, //通关失败
  award: mongoose.model('Award').schema, //获得奖品
  answers: [{
    quiz: {type: ObjectId, ref: 'Quiz'},
    level: Number,  //本题关卡
    answer: [], //多选
    score: {type: Number},  //本题得分
    sign: {type: Boolean}   //本题标记
  }],
  time: [{
    level: Number,    //关卡
    start: Date,
    end: Date,
    total: Number,    //本关总分
    pass: Boolean,    //本关是否通过，
    score: Number    //本关得分

  }]
}, {timestamps: true});

/**
 * 根据用户获取当前正在进行中的答题
 * @param id
 * @param user
 * @param done
 */
QuizAnswerSchema.statics.ongoing = function (id, user, done) {
  var today = new Date();
  var date = new Date(today.getFullYear() + ' ' +(today.getMonth()+1) + ' ' + today.getDate());
  if(typeof user.openid !== 'undefined' && user.openid) {
    var q = {'quizRun': id,'user.openid':user.openid, finished: false, fail: false, startAt: {$gte: date}};
    QuizAnswer.findOne(q).populate('quizRun').exec(function(err, answer) {
      if(err) {
        return done(err, answer);
      }
      if(answer &&  !answer.finished) {
        return done(err,answer);
      }
      return done(err, null);

    });
  } else {
    var q = {'quizRun': id,'user.mobile':user.mobile, finished: false, fail: false, startAt: {$gte: date}};
    QuizAnswer.findOne(q).populate('quizRun').exec(function(err, answer) {
      if(err) {
        return done(err, answer);
      }
      if(answer &&  !answer.finished) {
        return done(err,answer);
      }
      return done(err, null);

    });
  }

  /*if (user.mobile) {
    q['user.mobile'] = user.mobile;
  } else if (user.openid) {
    q['user.openid'] = user.openid;
  }
  q.finished = false;

  QuizAnswer.findOne(q).populate('quizRun').exec(function (err, answer) {
    if (err) console.error(err);
    return done(err, answer);
  });*/
};

var QuizAnswer = mongoose.model('QuizAnswer', QuizAnswerSchema, 'quizanswers');

module.exports = QuizAnswer;
