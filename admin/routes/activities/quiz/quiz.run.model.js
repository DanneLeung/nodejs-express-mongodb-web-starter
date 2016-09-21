/**
 * 答题闯关活动
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');


var QuizRunSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道，渠道内部公众号间共享
  wechat: {type: ObjectId, ref: "ChannelWechat"}, //使用的微信号
  activity: {type: ObjectId, ref: "Activities"}, //控制使用的活动
  quizPool: {type: ObjectId, ref: "QuizPool"}, //关联题库
  name: {type: String, required: false, default: ''}, //闯关名称
  logoPic: {type: String, required: false, default: ''}, //入口url生产的二维码
  description: {type: String, required: false, default: ''}, //闯关规则说明
  keyword: {type: String, required: false, default: ''}, //关键字
  url: {type: String, required: false, default: ''}, //入口url
  logo: {type: String, required: false, default: ''}, //入口url生产的二维码
  levelNum: {type: String, default: 1}, //关卡数
  award: mongoose.model('Award').schema, //通关后奖品
  levels: [{
    level: {type: Number, default: 1}, //第几关，从1开始
    levelName: {type: String, default: ""}, //第几关，从1开始
    score: {type: Number, default: 0}, //当前level完成获得分值
    award: mongoose.model('Award').schema, //当前关卡的奖品
    awardDesc: {type: String, default: ""}, //当前闯关通过所获得奖品的说明
    minLevel: {type: Number}, //匹配问题难度最小值
    maxLevel: {type: Number}, //匹配问题难度最大值
    cancellable: {type: Boolean, default: false}, //是否可以跳过此关，默认不可以
    allPass: {type: Boolean, default: true}, //关卡中必须全部题目答对
    random: {type: Boolean, default: true}, //题库中随机出题
    randNum: Number, //题库随机获取的题目数量
    second: Number //闯关时间（秒）
  }], //关卡
  enabled: {type: Boolean, default: false} //激活
}, {timestamps: {}});


QuizRunSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('QuizRun')
    .findOne({
      name: that.name,
      channel: that.channel
    }, function (err, site) {
      if (err) {
        done(err);
      } else if (site && !(site._id.equals(that._id))) {
        that.invalidate('name', '答题闯关活动名称必须唯一');
        done(new Error('答题闯关活动名称必须唯一'));
      } else {
        done();
      }
    });
});

module.exports = mongoose.model('QuizRun', QuizRunSchema, 'quizruns');
