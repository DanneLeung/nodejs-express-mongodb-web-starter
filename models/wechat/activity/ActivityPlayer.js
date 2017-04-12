/**
 * 活动参与者记录，用户数据统计
 */
'use strict';

var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../../../config/config');
var httpUtil = require(config.root + '/util/httpUtil');
var moment = require('moment');

var ActivityPlayerSchema = new Schema({
  channel: { type: ObjectId, ref: "Channel" }, //渠道
  wechat: { type: ObjectId, index: true, ref: "Wechat" }, //使用的微信号
  activity: { type: ObjectId, index: true, ref: "Activities" }, //参与的活动
  currAwardId: { type: ObjectId, ref: "Award" }, //中奖存id
  user: {
    member: { type: ObjectId, ref: 'Member' },
    fans: { type: ObjectId, ref: 'WechatFans' },
    mobile: { type: String, index: true, default: '' }, //手机
    fullname: { type: String, default: '' }, //真实姓名
    identity: { type: String, default: '' }, //身份证
    email: { type: String, default: '' }, //email
    openId: { type: String, index: true, default: '' }, //openId
    nickname: { type: String, default: '' }
  },
  shareTimes: { type: Number, default: 0 }, //分享次数
  shareUpdateAt: { type: Date, default: Date.now }, //分享次数
  totalTimes: { type: Number, default: 1 }, //总参与次数，没参与一次+1
  weekNth: { type: Number, default: 0 }, //周更，本年中第几周
  weeklyTimes: { type: Number, default: 1 }, //本周参与次数，按天合计周参与次数
  todayTimes: { type: Number, default: 1 }, //当日参与次数，当日参与次数
  timesUpdateAt: { type: Date, default: Date.now }, //次数更新时间
  winTimes: { type: Number, default: 0 }, //获奖次数
  winTimesPerActiity: { type: Number, default: 0 }, //获奖次数 新活动创建置0
  lastId: { type: String, default: '' }, //上次活动id，方便置0更换了将winTimesPerActiity置0
  //winned: {type: Boolean}, //得奖？得奖则查询ActivityWinner记录
  awards: [{
    award: mongoose.model('Award').schema,
    info: {},
    item: [mongoose.model('AwardItem').schema],
    time: Date
    //status: false    //领取状态,针对非手动冲奖
  }], //获得奖品]
}, { timestamps: {} });

ActivityPlayerSchema
  .virtual('totalRemains')
  .get(function () {
    return(this.activity && !this.activity.isPrototypeOf(ObjectId)) ? this.activity.timesPerUser - this.totalTimes : 0;
  });

ActivityPlayerSchema
  .virtual('todayRemains')
  .get(function () {
    return(this.activity && !this.activity.isPrototypeOf(ObjectId)) ? this.activity.timesPerDay - this.todayTimes : 0;
  });

/**
 * 获奖加入player
 * @param user 用户信息
 * @awardInfo.awardId 奖品id
 * @awardInfo.info.id 此次活动的id，若多个活动关联一个activityId，用于新活动重置中奖人数
 * @awardInfo.info.level 和awardInfo.infoe.id中用于判断是否重复领奖（闯关）【null || Number】
 * awardInfo.allPass 奖品领完时提示语，-1 0 1
 * awardInfo.activityId 关联活动的id
 * awardInfo.flow 针对流量充值，true代表调用接口，undefined || false代表人工充值
 * awardInfo.wid 调用接口充值流量时所需
 * @param done callback
 */

ActivityPlayerSchema.statics.pushAwards = function (user, awardInfo, done) {
  var Activities = mongoose.model('Activities');
  var ActivityWinner = mongoose.model('ActivityWinner');
  var ChargeOrder = mongoose.model('ChargeOrder');
  var q = { 'user.openId': user.openId };
  q.activity = awardInfo.activityId;
  mongoose.model('ActivityPlayer').findOne(q, function (err, player) {
    if(err) {
      return done(err, null);
    }
    if(!player) {
      return done('查无此人！', null);
    }
    if(!awardInfo.awardId && player.currAwardId) {
      awardInfo.awardId = player.currAwardId ? player.currAwardId.toString() : '';
    }
    Activities.findById(awardInfo.activityId, function (err, activities) {
      if(err) {
        return done(err, null);
      }

      //领奖次数超过限制
      if(player.winTimesPerActiity >= activities.winPerUser) {
        return done('您已参与并领取奖品，欢迎下次参与！', player);
      }

      //活动关联中库存剩余量
      var awards = activities.awards,
        level = 0;
      if(!awardInfo.awardId) {
        return done('系统显示您没有获奖信息！', player);
      }
      awards.forEach(function (award, idx) {
        if(award.award._id == awardInfo.awardId.toString()) {
          level = idx;
        }
      });
      //是否当天奖品库存
      if(!awards[level].update) {
        var key = 'awards.' + level + '.update';
        var set = {};
        set[key] = new Date();
        Activities.findOneAndUpdate({ _id: awardInfo.activityId }, { '$set': set }, function (e, o) {});
      } else {
        var d = moment(awards[level].update).format('YYYYMMDD');
        var today = moment(new Date()).format('YYYYMMDD');
        if(d != today && awards[level].dayCount > 0) {
          var key1 = 'awards.' + level + '.count';
          var key2 = 'awards.' + level + '.update';
          var set = {};
          set[key1] = awards[level].dayCount;
          set[key2] = new Date();
          Activities.findOneAndUpdate({ _id: awardInfo.activityId }, { '$set': set }, function (e, o) {
            console.log('是否当天奖品库存', e);
          });
          awards[level].count = awards[level].dayCount;
        }
      }
      if(awards[level].count <= 0) {
        if(awardInfo.allPass == 1) {
          return done('您来晚了，奖品已被领取完了，下周要早点哦！', null);
        } else if(awardInfo.allPass == 0) {
          return done('您来晚了，奖品已被领取完了，去下一关试试吧！', null);
        } else if(awardInfo.allPass == -1) {
          return done('今日奖品已发完，明日请早哦！', null);
        } else {
          return done('您来晚了，奖品已被领取完了！', null);
        }
      }
      //已领过此奖
      var getThis = false;
      if(awardInfo.info && awardInfo.info.level && awardInfo.info.id && player.awards.length > 0) {
        player.awards.forEach(function (award) {
          if(award.info.id == awardInfo.info.id && award.info.level == awardInfo.info.level) {
            getThis = true;
            return;
          }
        });
      };
      if(getThis) {
        return done('您已参与并领取此奖品，欢迎下次参与！', player);
        return;
      }

      //winTimesPerActiity是否置0
      if(awardInfo.info && player.lastId && awardInfo.info.id && awardInfo.info.id != player.lastId) {
        player.winTimesPerActiity = 0;
      }

      var Award = mongoose.model('Award');
      var AwardItem = mongoose.model('AwardItem');
      //get item
      var now = new Date();
      Award.findOne({
        _id: awardInfo.awardId,
        stock: { $gt: 0 },
        enabled: true
      }, function (err, award) {
        if(err || !award || award.length == 0) {
          if(awardInfo.allPass == 1) {
            return done('您来晚了，奖品已被领取完了，下周要早点哦！', null);
          } else if(awardInfo.allPass == 0) {
            return done('您来晚了，奖品已被领取完了，去下一关试试吧！', null);
          } else if(awardInfo.allPass == -1) {
            return done('今日奖品已发完，明日请早哦！', null);
          } else {
            return done('您来晚了，奖品已被领取完了！', null);
          }
        }
        async.waterfall([function (cb) {
          Activities.dailyWin(awardInfo.activityId, function (err) {
            return cb(err, null);
          });
        }, function (data, cb) {
          var num = award.num,
            awardsId = [];
          if(award.hasItems) {
            for(var i = 0; i < num; i++) {
              (function (i) {
                awardsId.push(awardInfo.awardId);
              })(i);
            }
            async.map(awardsId, function (aid, callback) {
              AwardItem.findOneAndUpdate({
                award: aid,
                taken: false,
                toVoid: false,
                startTime: {
                  $lte: now
                },
                endTime: {
                  $gte: now
                }
              }, {
                $set: { taken: true, status: '已领取' }
              }, function (err, item) {
                callback(err, item)
              });
            }, function (err, items) {
              if(err) {
                return callback(err, null);
              }

              if(!items || items.length == 0) {
                if(awardInfo.allPass == -1) {
                  return cb('今日奖品已发完，明日请早哦！', null);
                } else {
                  return cb('今日奖品已经领取完了，明天来早点哦！', null);
                }
              }
              var newItems = [];
              items.forEach(function (item) {
                if(item) {
                  newItems.push(item);
                }
              });

              if(newItems.length == 0) {
                if(awardInfo.allPass == -1) {
                  return cb('今日奖品已发完，明日请早哦！', null);
                } else {
                  return cb('今日奖品已经领取完了，明天来早点哦！', null);
                }
              }
              var lnum = award.num; //临时存储
              award.num = items.length;

              resetStock(award, function (error, p) {
                if(error) {
                  return cb(error, null);
                }
                award.num = lnum;
                var pushAward = [{
                  award: award,
                  info: awardInfo.info,
                  item: items,
                  time: new Date()
                }];
                return cb(null, pushAward);
              })
            });
          } else {
            //若是流量&&调用充值接口
            if(typeof awardInfo.flow !== 'undefined' && awardInfo.flow && award.name.indexOf('流量') >= 0) {
              var value = award.name.slice(0, 2);
              saveFlowrate({
                openid: user.openId,
                channel: awardInfo.channel,
                mobile: user.mobile,
                wid: awardInfo.wid,
                fansId: user.fans,
                value: value,
                clientOrderId: player._id.toString()
              }, function (e) {
                if(e) {
                  cb(e, null);
                  return;
                } else {
                  resetStock(award, function (error, p) {
                    if(error) {
                      return cb(error, null);
                    }
                    var pushAward = [{
                      award: award,
                      info: awardInfo.info,
                      item: null,
                      time: new Date()
                    }];
                    return cb(null, pushAward);
                  })
                }
              });
            } else {
              //!(若是流量&&调用充值接口)
              resetStock(award, function (error, p) {
                if(error) {
                  return cb(error, null);
                }
                var pushAward = [{
                  award: award,
                  info: awardInfo.info,
                  item: null,
                  time: new Date()
                }];

                return cb(null, pushAward);
              });
            }
          }
        }], function (err, results) {
          if(err) {
            return done(err, results);
          }
          //
          q.currAwardId = { '$ne': null };
          mongoose.model('ActivityPlayer').findOneAndUpdate(q, {
            //player.update({
            $pushAll: { awards: results },
            $inc: { winTimes: 1, winTimesPerActiity: 1 },
            lastId: awardInfo.info.id,
            currAwardId: null,
            'user.mobile': user.mobile
          }, function (err, newPlayer) {
            if(!err && newPlayer) {
              var winner = new ActivityWinner();
              var aLen = results.length - 1;
              winner.activity = awardInfo.activityId;
              winner.user = user;
              winner.awards = {
                level: level + 1,
                time: new Date(),
                awardName: level + 1 + '等奖',
                award: results[aLen].award,
                item: results[aLen].item
              }
              winner.save();
            }
            done(err, newPlayer);
          });

        });

        //重置库存
        function resetStock(prize, callback) {
          //activities奖品数量--
          async.series([function (cb2) {
            Award.findOneAndUpdate({ _id: awardInfo.awardId }, {
              $inc: { stock: -prize.num, usedNum: prize.num }
            }, function (err, a) {
              if(err) {
                return cb2('领奖出错啦！', null);
              }
              return cb2(null, a);
            });
          }, function (cb2) {
            Activities.findOneAndUpdate({ _id: awardInfo.activityId }, { $inc: { __v: 1 } }, function (e, o) {

              if(e) {
                return cb2('领奖出错啦！', null);
              }
              if(o) {
                var awards = o.awards,
                  level = 0;
                awards.forEach(function (award, idx) {
                  if(award.award._id == awardInfo.awardId.toString()) {
                    level = idx;
                  }
                });
                var ak1 = 'awards.' + level + '.count';
                var aset = {};
                aset[ak1] = -prize.num;
                //awards[level].count -= prize.num;
                //awards[level].count = awards[level].count < 0 ? 0 : awards[level].count;
                var v = o.__v;
                v += 1;
                Activities.findOneAndUpdate({ _id: awardInfo.activityId, __v: v }, { $inc: aset }, function (err, a) {
                  if(err) {
                    return cb2('领奖出错啦！', null);
                  }
                  return cb2(null, a);
                });
              }
            });
          }], function (error, results) {
            return callback(error, results);
          });
          //
        }
      });
    })

  })

  /**
   * 领取流量
   * @param req
   * @param res
   */
  var saveFlowrate = function (info, callback) {
    var openid = info.openid;
    var mobile = info.mobile;
    var wid = info.wid;
    getMobileFlowrate(mobile, info.value, function (err, data) {
      if(err) {
        callback(err);
        return;
      } else {
        ChargeOrder.find({
          day: moment().format('YYYYMMDD'),
          openid: openid,
          wechat: wid
        }, function (err, orders) {
          if(err) {
            callback('流量充值失败！');
            return;
          }
          if(orders.length > 0) {
            callback('您今日已领过奖品');
            return;
          }
          var no = Date.now();
          var chargeOrder = new ChargeOrder({
            channel: info.channel,
            clientOrderId: no, //info.clientOrderId, //playerId
            no: no,
            day: moment().format('YYYYMMDD'),
            wechat: wid,
            wechat: info.fansId,
            openid: openid,
            mobile: mobile,
            type: '1', //充值流量
            status: '1', //待处理
            packageSize: data.packageSize, //流量大小
            operators: data.operators, //运营商
            desc: '签到领流量' //活动标示
          });
          chargeOrder.save(function (e, o) {
            callback(e);
          });

        });
      }
    });
  }

  /**
   * 根据手机号码所属运营商，获取对应的充值流量
   * 移动 电信 10M    联通20M
   * 移动 电信 30M    联通 50m
   * @param mobile 手机号
   */
  function getMobileFlowrate(mobile, value, cb) {
    checkMobile(mobile, function (err, yysTypeID) {
      if(err) {
        console.log('获取流量参数值错误:', err, mobile);
        cb('流量充值失败！', null);
      } else {
        //检查是粉丝关注数量
        var v = Number(value);
        isNaN(v) ? v = 10 : v = Number(value);
        if(yysTypeID == '1') {
          return cb(null, { "packageSize": v, "operators": "1" });
        } else if(yysTypeID == '2') {
          //联通
          if(value == 10)
            v = 20;
          else
            v = 50;
          return cb(null, { "packageSize": v, "operators": "2" });
        } else if(yysTypeID == '3') {
          return cb(null, { "packageSize": v, "operators": "3" });
        } else {
          return cb('此号码不属于三大运营商', 0);
        }
      }
    });
  }

  function checkMobile(mobile, cb) {
    httpUtil.get("http://hyif.dahanbank.cn/FCGetAttribution", { "mobile": mobile }, function (err, obj) {
      if(err || !obj) {
        return cb('请输入11位手机号码！', null);
      } else if(obj.resultCode && obj.resultCode == '1') {
        var msg = obj.resultMsg;
        if(msg && msg.indexOf('请传入11位手机号码') > 0) {
          msg = '请输入11位手机号码！';
        }
        return cb(msg, null);
      }
      //else if(obj.provinceID && obj.provinceID != '24'){
      //    return cb('此活动仅限于上海地区，敬请谅解！', null);
      //}
      else if(obj.yysTypeID) {
        return cb(null, obj.yysTypeID);
      } else {
        return cb('此号码不属于三大运营商', null);
      }
    });
  }
}

var ActivityPlayer = mongoose.model('ActivityPlayer', ActivityPlayerSchema, 'activityplayers');
module.exports = ActivityPlayer;