/**
 * 微信线上签到记录模型
 */
"use strict";
var moment = require('moment');
var mongoose = require('mongoose');
var ShortId = require('shortid');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var SignListSchema = mongoose.Schema({
  sign: {type: String, index: true, ref: 'Sign'},
  fans: {type: ObjectId, index: true, ref: 'WechatFans'},
  //time: {type: Date, required: false}, //签到时间
  point: {type: Number, default: 0}, //每天签到获得积分
  token: {type: String, default: ''},//参与活动游戏密钥
  //award: {type: Boolean, default: false},
  status: {type: String, default: '1'}, //
  date: {type: String, default: ''}
}, {timestamps: {}});

var findToday = function (fansId, signId, done) {
  var today = moment().format('YYYYMMDD');
  //var start = moment().startOf('day');
  //var end = moment().endOf('day');
  var q = {fans: fansId, sign: signId, date: today};
  console.log("*********** 今日签到记录查询条件 ", q);
  SignList.findOne(q).exec(done);
};

SignListSchema.statics.findBySignId = function (signId, fansId, done) {
  var Sign = mongoose.model('Sign');
  Sign.findById(signId, function (err, sign) {
    if (err) console.error(err);
    if (!sign) {
      return done("签到活动不存在，系统错误", null);
    }
    if(sign && !sign.enabled) {
      return done("签到活动已下线！", null);
    }
    if(sign && !sign.enabled) {
      return done("签到活动已下线！", null);
    }
    var now = new Date();
    var startTime = sign.startTime;
    var endTime = sign.endTime;
    if (startTime > now) {
      return done('活动还没开始，请耐心等待！', null);
    }
    if (endTime < now) {
      return done('活动已经结束，请下次参与！', null);
    }
    //读取最近7天记录
    //var q = [{ channel: '56f4d7bada24525f1335756b', type: {'$in': ['3', '4']}, default: true}, {channel: '56f4d7bada24525f1335756b', type: {'$in': ['3', '4']}}];
    SignList.find({sign: signId, fans: fansId}).sort('createdAt:-1').limit(7).exec(function (err, signList) {
      let now = moment(), count = 1;
      console.log("****************** 签到日期记录 ", now.format("YYYY-MM-DD"), signList);
      let startTime = moment(sign.startTime).startOf('day');//开始之日
      let newSignList = [];
      let current;
      while (now > startTime && count <= 7) {
        console.log("****************** 签到日期 ", now.format("YYYY-MM-DD"));
        if (signList && signList.length) {
          for (let j in signList) {
            let sl = signList[j];
            if (moment(sl.createdAt).startOf('day') <= now && now < moment(sl.createdAt).endOf('day')) {
              current = sl;
              break;
            }
          }
        }
        if (!current) {
          console.log("****************** 签到日期 ", now.format("YYYY-MM-DD"), "没有签到记录");
          current = new SignList({createdAt: now, sign: signId, fans: fansId, status: "0"});
          if (count != 1)
            newSignList.push(current);
        } else {
          current.status = "1";
          newSignList.push(current);
        }
        current = null;
        count++;
        now.subtract(1, 'days');
      }
      return done(null, newSignList);
    });
  });
}

SignListSchema.statics.findToday = findToday;

/**
 * 签到
 * @param fansId
 * @param signId
 * @param done
 */
SignListSchema.statics.in = function (openid, fansId, signId, done) {
  findToday(fansId, signId, function (err, td) {
    if (err) console.error(err);
    if (td) {
      return done("今日已经签到", td);
    }
    var Sign = mongoose.model('Sign');
    Sign.findById(signId, function (err, sign) {
      if (err) console.error(err);
      if (!sign) {
        return done("签到活动不存在，系统错误", null);
      }
      let date = moment().format('YYYYMMDD');//今日
      var update = {$set: {point: sign.point}};
      SignList.findOneAndUpdate({sign: signId, fans: fansId, date: date}, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }, (err, signList)=> {
        if (err) console.log(err);
        //没有token且需要token
        if (signList && sign.genToken && !signList.token) {
          let ActivityToken = mongoose.model('ActivityToken');
          //生成token并保存
          console.log('-------------------------openid', openid);
          ActivityToken.generate(openid, signId, sign.successRedirect, date, 1, (err, token)=> {
            signList.token = token.token;
            console.log('-----------------------------token',token);
            signList.save().then(s=>done(null, s));
          });
        } else {
          done(null, signList);
        }
      });
    });
  });
}

var SignList = mongoose.model('SignList', SignListSchema, 'wechatsignlist');
module.exports = SignList;
