/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');
var Player = mongoose.model('ActivityPlayer');
var Winner = mongoose.model('ActivityWinner');

var _ = require('lodash');

/**
 * 列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('activities/players', {activityId: req.params.id});
};

/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Player.dataTable(req.query, {
    conditions: {
      activity: req.params.id,
      wechat: req.session.wechatId
    }
  }, function (err, data) {
    res.send(data);
  });
}


/**
 * 中奖纪录的列表
 * @param req
 * @param res
 */
exports.r_list = function (req, res) {
  res.render('activities/recordList', {activityId: req.params.id});
};

/**
 * 中奖纪录的数据
 * @param req
 * @param res
 */
exports.r_data_table = function (req, res) {

  var awardName = req.query.awardName;
  var names = req.query.name;
  var startAt = req.query.startAt;
  var query = {};
  if (awardName) {
    var name = {'awards.awardName': awardName};
    query = _.assign(query, name);
  }
  if (names) {
    var mob = {'awards.award.name': names};
    query = _.assign(query, mob);
  }
  if (startAt) {
    var op = startAt.split(" - ");
    var op1 = new Date(moment(op[0]));
    var op2 = new Date(moment(op[1]));
    query.createdAt = {$gte: op1, $lt: op2};
  }
  query.activity = req.params.id;

  console.log("query=======================", query);

  Winner.dataTable(req.query, {
    conditions: query
  }, function (err, data) {
    res.send(data);
  });
}


/**
 * 中奖纪录导出
 * @param req
 * @param res
 */
exports.download = function (req, res) {

  var label = "姓名" + "," + "手机号码" + "," + "奖项" + "," + "奖品" + "," + "中奖时间" + "\n";
  var awardName = req.query.awardName;
  var names = req.query.name;
  var startAt = req.query.startAt;
  var query = {};
  if (awardName) {
    var name = {'awards.awardName': awardName};
    query = _.assign(query, name);
  }
  if (names) {
    var mob = {'awards.award.name': names};
    query = _.assign(query, mob);
  }
  if (startAt) {
    var op = startAt.split(" - ");
    var op1 = new Date(moment(op[0]));
    var op2 = new Date(moment(op[1]));
    query.createdAt = {$gte: op1, $lt: op2};
  }
  query.activity = req.params.id;
  console.log("query=======================", query);

  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  getData(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "winnerUser" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
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
function getData(query, callback) {
  //var
  Winner.find(query).sort({'updatedAt': -1}).exec(function (err, win) {
    if (win && win.length > 0) {
      var bufs = "";
      win.forEach(function (e) {
        var name = '';
        if (e.awards) { //如有中奖
          name += e.awards.award ? e.awards.award.name : "";
          if (e.awards.item && e.awards.item.length > 0) { //如果有明细，将明细的券号获取
            name += " 兑换码:";
            e.awards.item.forEach(function (i) {
              name += i.code + "; ";
            });
          } else {
            name += "; ";
          }
        } else {
          name += "谢谢参与";
        }
        var fullname = e.user.fullname ? e.user.fullname : " ";
        var mobile = e.user.mobile ? e.user.mobile : " ";
        bufs += fullname + "," + mobile + "," + e.awards.awardName + "," + name + "," + moment(e.updatedAt).format("YYYY-MM-DD HH:mm:ss") + "\n";
      });
      callback(null, bufs);
    } else {
      callback(err, null);
    }
  });
}


/**
 * 参与人员的导出
 * @param req
 * @param res
 */
exports.p_download = function (req, res) {

  var label = "姓名" + "," + "昵称" + "," + "手机号码" + "," + "分享次数" + "," + "今日次数" + "," + "本周次数" + "," + "总参与次数" + "," + "得奖次数" + "\n";
  var query = {};
  query.activity = req.params.id;
  console.log("query=======================", query);

  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  get_P_Data(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "winnerUser" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
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
function get_P_Data(query, callback) {
  //var
  Player.find(query).sort({'updatedAt': -1}).exec(function (err, win) {
    if (win && win.length > 0) {
      var bufs = "";
      win.forEach(function (e) {
        var fullname = e.user.fullname ? e.user.fullname : " ";
        var nickname = e.user.nickname ? e.user.nickname : " ";
        var mobile = e.user.mobile ? e.user.mobile : " ";
        bufs += fullname + "," + nickname + "," + mobile + "\t," + e.shareTimes + "," + e.todayTimes + "," + e.weeklyTimes + "," + e.totalTimes + "," + e.winTimes + "\n";
      });
      callback(null, bufs);
    } else {
      callback(err, null);
    }
  });
}


