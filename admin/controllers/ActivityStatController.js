/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');

var moment = require('moment');
var _ = require('lodash');

var ActivityStat = mongoose.model('ActivityStat');
var ActivityLog = mongoose.model('ActivityLog');
var ActivityPlayer = mongoose.model('ActivityPlayer');

/**
 * 列表
 * @param req
 * @param res
 */
exports.stat = function (req, res) {
  res.render('activities/statistics', {activityId: req.params.id});
};
/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {

  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var startAt = req.query.startAt;
  var query = {};
  if (fullname) {
    var name = {'user.fullname': fullname};
    query = _.assign(query, name);
  }
  if (mobile) {
    var mob = {'user.mobile': mobile};
    query = _.assign(query, mob);
  }
  if (startAt) {
    var op = startAt.split(" - ");
    var op1 = new Date(moment(op[0]));
    var op2 = new Date(moment(op[1]));
    query.updatedAt = {$gte: op1, $lt: op2};
  }
  query.activity = req.params.activityId;
  query.wechat = req.session.wechatId;

  ActivityPlayer.dataTable(req.query, {
    conditions: query
  }, function (err, data) {
    res.send(data);
  });
}

/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.export = function (req, res) {

  var runId = req.params.id;
  var label = "用户姓名" + "," + "手机号码" + "," + "访问总数" + "," + "访问周次" + "," + "访问日次" + "," + "时间" + "," + "奖品" + "\n";
  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var startAt = req.query.startAt;
  var query = {};
  if (fullname) {
    var name = {'user.fullname': fullname};
    query = _.assign(query, name);
  }
  if (mobile) {
    var mob = {'user.mobile': mobile};
    query = _.assign(query, mob);
  }
  if (startAt) {
    var op = startAt.split(" - ");
    var op1 = new Date(moment(op[0]));
    var op2 = new Date(moment(op[1]));
    query.updatedAt = {$gte: op1, $lt: op2};
  }
  query.activity = req.params.activityId;
  query.wechat = req.session.wechatId;
  console.log("query=======================", query);

  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  getEvent(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "userAward" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(label);
  })
}


/**
 * 获取中奖用户的信息集合
 * @param query 查询数据的条件
 * @param callback
 */
function getEvent(query, callback) {
  //var
  ActivityPlayer.find(query).sort({'updatedAt': -1}).exec(function (err, player) {
    if (player && player.length > 0) {
      var bufs = "";
      player.forEach(function (e) {
        var name = '';
        if (e.awards && e.awards.length > 0) { //如有中奖
          e.awards.forEach(function (a) {      //获取奖品名称
            name += a.award.name;
            if (a.item && a.item.length > 0) { //如果有明细，将明细的券号获取
              name += " 兑换码:";
              a.item.forEach(function (i) {
                name += i.code + "; ";
              });
            } else {
              name += "; ";
            }
          })
        } else {
          name += "谢谢参与";
        }
        bufs += e.user.fullname + "," + e.user.mobile + "\t,"+ e.totalTimes+"" + ","+ e.weeklyTimes+"" + ","+ e.todayTimes+"" + "," + moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss") + "," + name + "\n";
      });
      callback(null, bufs);
    } else {
      callback(err, null);
    }
  });
}

/**
 * 列表
 * @param req
 * @param res
 */
exports.init = function (req, res) {

  var wechatId = req.session.wechat._id;
  var activityId = '573ea4aec5b26023637c9339';
  var a = moment(new Date()).format("YYYY/MM/DD 00:00:00");
  var date = new Date(a);
  for (var i = 0; i < 144; i++) {
    var stat = {
      //wechat: { type: ObjectId, ref: "ChannelWechat" }, //活动的微信号
      //activity: { type: ObjectId, ref: "Activities" }, //参与的活动
      datetime: date, //统计时间段，每1或10分钟，根据系统合计精度而定
      userCount: parseInt(i) + 5, //访问和参与的用户数
      shareTimes: parseInt(i) + 4, //分享次数
      readTimes: parseInt(i) + 3, //访问次数，每访问一次+1
      playTimes: parseInt(i) + 2, //参与次数，每参与一次+1
      winTimes: parseInt(i) + 1 //获奖人数
    }
    stat.wechat = wechatId;
    stat.activity = activityId;
    var ActivityStats = new ActivityStat(stat);
    ActivityStats.save(function (err, result) {
      if (err) {
        console.log("err==================", err);
      }
    })
    date = moment(date).add(10, 'minutes');
  }
  res.send("统计完成");
};

/**
 * 获取活动统计的列表 当天
 * @param req
 * @param res
 */
exports.getDataByDay = function (req, res) {
  var activityId = req.params.activityId;
  var a = moment(new Date()).format("YYYY/MM/DD 00:00:00");
  var b = moment(new Date()).add('days', +1).format("YYYY/MM/DD 00:01:00");
  var start = new Date(a);
  var end = new Date(b);
  getActiviyStat(activityId, start, end, function (err, datas) {
    if (!err) {
      res.send(datas);
    } else {
      res.send(null);
    }
  });
}
/**
 * 获取活动统计的列表 近七天
 * @param req
 * @param res
 */
exports.getDataByWeek = function (req, res) {
  var activityId = req.params.activityId;
  var a = moment(new Date()).add('days', -7).format("YYYY/MM/DD 00:00:00");
  var b = moment(new Date()).format("YYYY/MM/DD HH:mm:ss");
  var start = new Date(a);
  var end = new Date(b);
  getActiviyStat(activityId, start, end, function (err, datas) {
    if (!err) {
      res.send(datas);
    } else {
      res.send(null);
    }
  });
}
/**
 * 获取活动统计的列表  近30天
 * @param req
 * @param res
 */
exports.getDataByMonth = function (req, res) {
  var activityId = req.params.activityId;
  var a = moment(new Date()).add('days', -30).format("YYYY/MM/DD 00:00:00");
  var b = moment(new Date()).format("YYYY/MM/DD HH:mm:ss");
  var start = new Date(a);
  var end = new Date(b);
  getActiviyStat(activityId, start, end, function (err, datas) {
    if (!err) {
      res.send(datas);
    } else {
      res.send(null);
    }
  });
}

/**
 * 根据活动，开始时间、结束时间查询活动的统计结果，
 * 并使得数据拼接成线性图的数据
 * @param activityId 活动的ID号
 * @param start 查找的开始时间
 * @param end 查找的结束时间
 * @param callback  回调函数 err，result
 */
function getActiviyStat(activityId, start, end, callback) {
  var dateTimes = [];//统计时间段
  var userCounts = [];//访问和参与的用户数
  var shareTimes = [];//分享次数
  var readTimes = [];//访问次数
  var playTimes = [];//参与次数
  var winTimes = [];//获奖人数
  var datas = {};
  datas.series = [];
  ActivityStat.find({
    activity: activityId,
    datetime: {$gte: start, $lt: end}
  }).sort("datetime").exec(function (err, data) {
    if (data) {
      data.forEach(function (e) {   //拼接统计图标的数据
        dateTimes.push(moment(e.datetime).format("YYYY/MM/DD HH:mm:ss"));
        userCounts.push(e.userCount);
        shareTimes.push(e.shareTimes);
        readTimes.push(e.readTimes);
        playTimes.push(e.playTimes);
        winTimes.push(e.winTimes);
      })
      var d = [userCounts, shareTimes, readTimes, playTimes, winTimes]
      var name = ['访问用户', '分享次数', '访问次数', '参与次数', '获奖人数']
      for (var i = 0; i < 5; i++) {
        var serie = {
          name: name[i],
          type: 'line',
          data: d[i]
        };
        datas.series.push(serie);
      }
      datas.xAxis = dateTimes;
      datas.legend = name;
    }
    callback(err, datas);
  });
}
