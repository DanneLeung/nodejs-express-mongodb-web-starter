/**
 * 站点管理
 */
var mongoose = require('mongoose');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');
var _ = require('lodash');

var QuizAnswer = require('./quiz.answer.model');
var QuizRun = require('./quiz.run.model');

/**
 * 列表
 * @param req
 * @param res
 */
exports.statList = function (req, res) {
  QuizRun.findById(req.params.id, function (err, run) {
    if (err) {
      res.render('activities/quiz/statAndList', {runId: req.params.id});
    } else {
      res.render('activities/quiz/statAndList', {runId: req.params.id, activityId: run.activity});
    }
  });
};
/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {

  var runId = req.params.id;
  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var startAt = req.query.startAt;
  var finished = req.query.finished;
  var query = {};
  query.quizRun = runId;
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
    query.startAt = {$gte: op1, $lt: op2};
  }
  if (finished) {
    query.finished = finished;
  }
  QuizAnswer.dataTable(req.query, {
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
  var label = "用户姓名" + "," + "手机号码" + "," + "完成时间" + "," + "奖品" + "\n";
  var query = {};
  query.quizRun = runId;
  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var startAt = req.query.startAt;
  var finished = req.query.finished;
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
    query.startAt = {$gte: op1, $lt: op2};
  }
  if (finished) {
    query.finished = finished;
  }

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
  QuizAnswer.find(query).sort({'award.name': -1}).exec(function (err, answer) {
    if (answer && answer.length > 0) {
      var bufs = "";
      answer.forEach(function (e) {
        var name = e.award ? e.award.name : "未中奖";
        bufs += e.user.fullname + "," + e.user.mobile + "\t," + moment(e.finishAt).format("YYYY-MM-DD HH:mm:ss") + "," + name + "\n";
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
    var QuizAnswers = new QuizAnswer(stat);
    QuizAnswers.save(function (err, result) {
      if (err) {
        console.log("err==================", err);
      }
    })
    date = moment(date).add(10, 'minutes');
  }
  res.send("统计完成");
};


var start = new Date(moment().format("YYYY/MM/DD 00:00:00"));
var end = new Date(moment().format("YYYY/MM/DD HH:mm:ss"));
getAnswerCount(start, end, function (err, data) {
  console.log("data.playNum===", data.playNum, "data.playNum===", data.finishNum);
});

/**
 * 获取活动统计的列表 当天
 * @param req
 * @param res
 */
exports.getDataByDay = function (req, res) {
  var runId = req.params.id;
  var start = new Date(moment().format("YYYY/MM/DD 00:00:00"));
  var newTime = new Date(moment().format("YYYY/MM/DD HH:mm:ss"));
  var datas = {};
  datas.playNums = [];
  datas.finishNums = [];
  datas.times = [];
  var fn = function (datas, start) {
    var a = Date.parse(start);
    var b = Date.parse(newTime);
    if (a <= b) {
      var end = new Date(moment(start).add('hour', +1).format("YYYY/MM/DD HH:mm:ss"));
      getAnswerCount(runId, start, end, function (err, data) {
        datas.playNums.push(data.playNum);
        datas.finishNums.push(data.finishNum);
        datas.times.push(moment(start).format("YYYY/MM/DD HH:mm:ss"));
        fn(datas, end);
      });
    } else {
      res.send(getResult(datas));
    }
  }
  fn(datas, start);

}

/**
 * 获取活动统计的列表 近七天
 * @param req
 * @param res
 */
exports.getDataByWeek = function (req, res) {
  var runId = req.params.id;
  var start = new Date(moment().add('days', -6).format("YYYY/MM/DD 00:00:00"));
  var newTime = new Date(moment().format("YYYY/MM/DD HH:mm:ss"));
  var datas = {};
  datas.playNums = [];
  datas.finishNums = [];
  datas.times = [];
  var fn = function (datas, start) {
    var a = Date.parse(start);
    var b = Date.parse(newTime);
    if (a <= b) {
      var end = new Date(moment(start).add('days', +1).format("YYYY/MM/DD 00:00:00"));
      getAnswerCount(runId, start, end, function (err, data) {
        console.log("getDataByWeek================", err);
        console.log("getDataByWeek================", data);
        datas.playNums.push(data.playNum);
        datas.finishNums.push(data.finishNum);
        datas.times.push(moment(start).format("YYYY/MM/DD"));
        fn(datas, end);
      });
    } else {
      res.send(getResult(datas));
    }
  }
  fn(datas, start);

}
/**
 * 获取活动统计的列表  近30天
 * @param req
 * @param res
 */
exports.getDataByMonth = function (req, res) {
  var runId = req.params.id;
  var start = new Date(moment().add('days', -30).format("YYYY/MM/DD 00:00:00"));//开始时间
  var newTime = new Date(moment().format("YYYY/MM/DD HH:mm:ss"));//现在的时间用于比较时间，结束当前查询
  var datas = {};
  datas.playNums = [];
  datas.finishNums = [];
  datas.times = [];
  var fn = function (datas, start) {
    var a = Date.parse(start);
    var b = Date.parse(newTime);
    if (a <= b) {
      var end = new Date(moment(start).add('days', +1).format("YYYY/MM/DD 00:00:00"));//分段查询时间
      getAnswerCount(runId, start, end, function (err, data) {
        datas.playNums.push(data.playNum);
        datas.finishNums.push(data.finishNum);
        datas.times.push(moment(start).format("YYYY/MM/DD"));
        fn(datas, end);
      });
    } else {
      res.send(getResult(datas));
    }
  }
  fn(datas, start);

}

/**
 * 根据时间段获取参与数和通关人数
 * @param runId 答题闯关的id
 * @param start 开始时间
 * @param end 结束时间
 * @param done 回调函数
 */
function getAnswerCount(runId, start, end, done) {

  var query = {};
  query.startAt = {$gte: start, $lt: end};
  query.quizRun = runId;

  async.parallel({
    playNum: function (callback) {
      QuizAnswer.count(query, function (err, result) {
        callback(err, result);
      });
    },
    finishNum: function (callback) {
      query.finished = true;
      //通关的人数
      QuizAnswer.count(query, function (err, result) {
        callback(err, result);
      });
    }
  }, function (err, result) {
    if (!err) {
      done(err, result);
    }
  });

}
/**
 * 组合数据
 * @param data
 * @returns {{}}
 */
function getResult(data) {
  var result = {};
  result.series = [];
  result.xAxis = [];
  if (data) {
    var serie1 = {
      name: "参与人数",
      type: 'line',
      data: data.playNums
    };
    result.series.push(serie1);
    var serie2 = {
      name: "通过人数",
      type: 'line',
      data: data.finishNums
    };
    result.series.push(serie2);
    result.xAxis = data.times;

  }
  result.legend = ["参与人数", "通过人数"];

  return result;
}
