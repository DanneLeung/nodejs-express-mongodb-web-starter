/**
 * 互动活动
 */
"use strict";
var moment = require('moment');
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ActivitiesSchema = mongoose.Schema({
  wechat: { type: ObjectId, index: true, ref: "Wechat" }, //使用的微信号
  type: { type: String, required: false, default: '' }, //活动类型
  code: { type: String, required: false, default: '' }, //代号
  name: { type: String, required: true, default: '' }, //名称
  description: { type: String, required: false, default: '' }, //说明，文案
  logo: { type: String, required: false, default: '' }, //活动logo，分享时使用
  url: { type: String, required: false, default: '' }, //活动入口URL
  qrcode: { type: String, required: false, default: '' }, //活动入口URL二维码
  keywords: { type: String, required: false, default: '' }, //关键字
  budget: { type: Number, required: false, default: 0 }, //活动预算，奖品实际价值value合计不应大于此值
  startTime: { type: Date, required: false, default: Date.now }, //开始时间
  endTime: { type: Date, required: false, default: Date.now }, //结束时间
  daily: { //每日重复控制时间
    //活动周期内每日限定时间内进行
    from: Number, //开始时间，时分，比如09：00写900，15：30写1530
    to: Number //结束时间
  },
  limit: { type: Number, required: false, default: 0 }, //限制人数
  //count: {type: Number, required: false, default: 0}, //已参与人数
  //ratio: {type: Number, required: false, default: 0}, //中奖率
  //次数等等控制
  validateMobile: { type: Boolean, default: true }, //需短信验证码验证手机号码
  needRegister: { type: Boolean, default: true }, //必须注册用户，粉丝
  times: { type: Number, required: false, default: 1 }, //每天限制参与人数
  timesPerUser: { type: Number, required: false, default: 1 }, //每人共可参与次数
  timesPerDay: { type: Number, required: false, default: 0 }, //每日每人可参与次数
  timesPerWeek: { type: Number, required: false, default: 0 }, //每周每人可参与次数
  sharedAddTimes: { type: Number, required: false, default: 0 }, //分享后可获得次数
  winPerUser: { type: Number, required: false, default: 1 }, //每个用户可得奖次数
  winPerDay: { type: Number, required: false, default: 0 }, //每天可获奖人数
  //活动奖项
  awards: [{
    sort: Number, //排序
    level: Number, //几等奖，数值控制，1，2，3，4，5 ...数值越小奖项越大
    awardName: String, //奖项名称，可以使用下拉框同时控制level和awardName
    award: require('./ActivityAward').schema, //奖品
    count: { type: Number, default: 1 }, //奖品数,领奖改变
    dayCount: { type: Number, default: 1 }, //每天奖品数，领奖不改变
    update: { type: Date }, //重置库存时间
    ratio: { type: Number, default: 0 }, //中奖率
    isEmpty: { type: Boolean, default: false }, //中奖率
    note: { type: String, default: '' } //描述，宣传说明
  }],
  whitelist: { type: ObjectId, ref: "ActivityWhiteList" }, //使用的白名单
  whitelistCount: { type: Number, default: false }, //使用的白名单人数
  presetWinners: [{ nickname: String, mobile: String, prize: { type: ObjectId, ref: "Award" }, time: Date }], //预设的用于显示的获奖名单信息
  //stats: [{date: Date, readCount: Number, playCount: Number, sharedCount: Number}], //按日进行数据统计：日期，读次数，参与次数，分享次数
  needToken: { type: Boolean, default: false }, // 是否需要活动凭证，如果需要，则检查token有效性
  online: { type: Boolean, default: false }, //上线,上线后不能变更活动内容
  enabled: { type: Boolean, default: true } //激活
}, { timestamps: {} });

ActivitiesSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Activities').findOne({ name: that.name }, function (err, site) {
    if(err) {
      done(err);
    } else if(site && !(site._id.equals(that._id))) {
      that.invalidate('name', '活动名称必须唯一');
      done(new Error('活动名称必须唯一'));
    } else {
      done();
    }
  });
});

ActivitiesSchema.statics.enabledList = function (wechat, done) {
  mongoose.model('Activities').find({ wechat: wechat, enabled: true }).exec(function (err, activities) {
    if(err) console.error(err);
    return done(activities ? activities : []);
  });
};

ActivitiesSchema.statics.award = function (id, done) {
  mongoose.model('Activities').findById(id).populate('awards').exec(function (err, r) {
    done(r.awards);
  });
};

ActivitiesSchema.statics.addAwards = function (id, awardIds, done) {
  mongoose.model('Activities').findById(id, function (err, activity) {
    //权限先合并再排除相同值的权限id
    activity.awards = _.uniq(_.union(activity.awards, awardIds), function (p) {
      //字符串比较
      return p + "";
    });
    activity.save(function (err, activity) {
      done(err, activity);
    });
  });
};

ActivitiesSchema.statics.revokeAwards = function (id, awardIds, done) {
  mongoose.model('Activities').findById(id, function (err, activity) {
    console.log("final awards:\n" + awardIds);
    // 去除选择解除权限的权限ID
    activity.awards = _.remove(activity.awards, function (n) {
      var idx = awardIds.some(function (p) {
        //字符串比较
        return p == n + "";
      });
      return !(awardIds == n + "" || idx);
    });
    activity.save(function (err, activity) {
      done(err, activity);
    });
  });
};
/**
 * 检查活动是否还在进行中
 */
ActivitiesSchema.statics.avalible = function (id, done) {
  mongoose.model('Activities').findById(id, function (err, activity) {
    //
    var msg = '活动时间为每日10:00 - 22:00，兴仔准时来开门哦!';
    if(err || !activity) {
      console.error(err);
      return done(err, activity);
    }
    if(!activity.enabled || !activity.online) {
      return done(msg, activity);
    }
    // 检查时间
    var now = new Date();
    var startTime = activity.startTime;
    var endTime = activity.endTime;
    if(startTime > now) {
      return done(msg, activity);
    }
    if(endTime < now) {
      return done(msg, activity);
    }
    // check limit
    var limit = activity.limit;
    var max = activity.count; //当前已参与人数
    if(limit > 0 && max >= limit) {
      return done(msg, activity);
    }
    return done(null, activity);
  });
};

/**
 * 查找参与活动的用户数据
 * @param id 活动id
 * @param user 参与用户
 * @param done callback
 */
ActivitiesSchema.statics.getPlayer = function (id, user, done) {
  var q = { 'activity': id };
  if(user.mobile) {
    q['user.mobile'] = user.mobile;
  } else if(user.openid) {
    q['user.openId'] = user.openid;
  }
  var Player = mongoose.model('ActivityPlayer');
  Player.findOne(q).populate('activity').exec(function (err, player) {
    console.log('************** player', player);
    return done(err, player);
  });
};
/**
 * 参与活动，系统检查用户是否还可以参与活动，可以生成参与记录
 * @param id 活动id
 * @param answer 是否有答题 || null
 * @param aid 子活动id || null
 * @param wechat {wid, wechat}
 * @param user 参与用户
 * @param done callback
 */
ActivitiesSchema.statics.take = function (id, answer, aid, wechat, user, done) {

  var today = new Date();
  var day = today.getDay();
  today = moment(today).format("YYYY-MM-DD");
  var q = { 'activity': id, $or: [] };
  if(user.mobile) {
    q.$or.push({ 'user.mobile': user.mobile });
  }
  if(user.openId) {
    q.$or.push({ 'user.openId': user.openId });
  }
  var Player = mongoose.model('ActivityPlayer');
  Player.findOne(q).populate('activity').exec(function (err, player) {
    if(err) {
      return done(err, player);
    }
    if(player && (!player.activity || !player.activity.enabled)) {
      return done('活动时间为每日10:00 - 22:00，兴仔准时来开门哦!', player);
    }
    if(player && player.user.openId.length == 0 && player.user.mobile.length == 0) {
      return done('没找到此用户！', null);
    }

    //get状态
    var Stats = mongoose.model('ActivityStat');
    Stats.findOne({ activity: id }).populate('activity').exec(function (err, stats) {
      if(err) {
        return done(err, null);
      }

      async.waterfall([function (cb) {
        //刚开始 创建状态
        if(!stats) {
          stats = new Stats({ activity: id });
          stats.save(function (err, s) {
            return cb(err, s);
          });
        } else {
          return cb(null, stats);
        }
      }, function (s, cb) {
        //日更 今日限制人数
        var update = moment(s.playTimesUpdateAt).format("YYYY-MM-DD");
        if(update != today) {
          Stats.findOneAndUpdate({ activity: id }, {
            $set: { playTimes: 0, winTimes: 0, playTimesUpdateAt: new Date(), winTimesUpdateAt: new Date() },
          }, function (err, newStats) {
            //retur cb(err, newStats);
          });
        }
        Stats.findOne({ activity: id }).populate('activity').exec(function (err, newStats) {
          return cb(err, newStats);
        });
      }, function (s, cb) {
        if(s.playTimes >= s.activity.times) {
          if(!player || (player && moment(player.timesUpdateAt).format("YYYY-MM-DD") != today)) {
            return cb('今日参与人数已达上限，明天早点来哦！', s);
          }
          return cb(null, s);
        } else {
          return cb(null, s);
        }
      }, function (s, cb) {
        //人数没达到上限
        if(!player) {
          //无player 参与人数+1 创建新player
          Stats.findOneAndUpdate({ activity: id }, {
            $inc: { playTimes: 1, lastId: aid },
            playTimesUpdateAt: new Date()
          }, function (err, newStats) {
            //return cb(err, newStats);
          });
          var data = {
            activity: id,
            user: user,
            timesUpdateAt: new Date(),
            weekNth: moment().format('w')
          };
          if(wechat && wechat.wechat) {
            data.wechat = wechat.wechat;
          }
          player = new Player(data);
          player.save(function (err, p) {
            return cb('true', p);
          });
        } else {
          var timesUpdateStr = moment(player.timesUpdateAt).format("YYYY-MM-DD");
          //旧用户
          if(today != timesUpdateStr) {
            //新状态->参与人数+1
            Stats.findOneAndUpdate({ activity: id }, {
              $inc: { playTimes: 1 },
              playTimesUpdateAt: new Date()
            }, function (err, newStats) {
              //return cb(err, newStats);
            });

            var $set = {
              todayTimes: 0,
              timesUpdateAt: new Date()
            };

            //周更
            if(typeof player.weekNth == 'undefined' || moment().format('w') != player.weekNth || moment().format('w') == player.weekNth && moment(player.timesUpdateAt).format('YYYY') != moment().format('YYYY')) {
              $set.weeklyTimes = 0;
              $set.weekNth = moment().format('w');
            }

            //用户今日参与次数置0 || 周更
            Player.findOneAndUpdate(q, $set, { new: true }, function (err, p) {
              console.log("********************* player updated ", err, p);
            });

            //新活动关联旧的活动列表，更新用户数据
            if(aid && aid != player.lastId || aid && !player.lastId) {
              player.lastId = aid;
              player.winTimesPerActiity = 0;
              player.weeklyTimes = 0;
              player.totalTimes = 0;
              player.shareTimes = 0;
              player.save(function (err, p) {
                p.activity = player.activity;
                return cb(err, p);
              });
            } else {
              Player.findOne(q).populate('activity').exec(function (err, p) {
                return cb(err, p);
              });
            }

          } else {
            return cb(null, player);
          }
        }
      }, function (p, cb) {
        var timesUpdateStr = moment(player.timesUpdateAt).format("YYYY-MM-DD");
        var activity = p.activity;
        //获奖超过限制
        if(activity.winPerUser > 0 && p.winTimesPerActiity >= activity.winPerUser) {
          return cb('您获奖次数超过限制，欢迎下次参与.', p);
        }
        // 参与次数限制
        if(activity.timesPerUser > 0 && p.totalTimes >= activity.timesPerUser) {
          return cb('您参与次数超过限制，欢迎下次参与.', p);
        }
        //每日参与次数限制
        if(activity.timesPerDay > 0 && p.todayTimes >= activity.timesPerDay && today == timesUpdateStr) {
          return cb('您今日参与次数超过限制，欢迎下次参与.', p);
        }

        //每周参与次数限制
        if(activity.timesPerWeek > 0 && p.weeklyTimes >= activity.timesPerWeek) {
          return cb('您本周参与次数超过限制，欢迎下次参与.', p);
        }

        return cb(null, p);
      }, function (p, cb) {
        //用户参与次数++
        if(!answer) {
          Player.findOneAndUpdate(q, {
            $inc: { totalTimes: 1, todayTimes: 1, weeklyTimes: 1 },
            timesUpdateAt: new Date()
          }, { new: true }, function (err, p) {
            // console.log("********************* player updated ", err, p);
            // return done(err, p);
          });

          return cb(null, p);
        } else {
          return cb(null, player);
        }
      }], function (err, result) {
        if(err && err == 'true') {
          return done(null, result);
        }
        return done(err, result);
      });
    });
  });
};

/**
 * 限制每日获奖人数
 * @param id 活动id
 * @param fieldArr 数组 需操作的字段
 * @param fieldUpdateArr 数组 需操作的字段更新时间
 */
ActivitiesSchema.statics.dailyWin = function (id, done) {
  var Stats = mongoose.model('ActivityStat');
  Stats.findOne({ activity: id }).populate('activity').exec(function (err, stats) {
    if(err) {
      return done(err);
    }

    //刚开始 创建状态
    if(!stats) {
      stats = new Stats({ activity: id });
      stats.save(function (err, p) {
        done(err);
      });
      return;
    }
    var today = new Date();
    today = moment(today).format("YYYY-MM-DD");
    var winTimesUpdateStr = moment(stats.winTimesUpdateAt).format("YYYY-MM-DD");
    var activity = stats.activity;
    //每日更新获奖人数次数
    if(today != winTimesUpdateStr) {
      Stats.findOneAndUpdate({ activity: activity._id }, {
        $set: {
          winTimes: 0,
          winTimesUpdateAt: new Date()
        }
      }, function (err, newStats) {
        //return cb(err, newStats);
      });
    }
    Stats.findOne({ activity: activity._id }, function (err, newStats) {
      if(newStats.winTimes >= activity.winPerDay && today == winTimesUpdateStr) {
        return done('今日奖品已经发放完，明天来早点哦！');
      }
      done(null);
    });
  });
};

module.exports = mongoose.model('Activities', ActivitiesSchema, 'activities');