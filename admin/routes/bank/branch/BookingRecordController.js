/**
 * Created by xingj on 2016/8/22.
 */
/**
 * Created by danne on 2015/10/29.
 */
"use strict";

var mongoose = require('mongoose');
var BookingRecord = mongoose.model('BookingRecord');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');
/*
 * list
 */
exports.list = function (req, res) {
  BookingRecord.find({}, function (err, booking) {
    res.render('bank/branch/bookingList', {
      booking: booking
    })
  })
};

/*
 * list
 */
exports.init = function (req, res) {
  for (var i = 0; i < 10; i++) {
    var booking = new BookingRecord();
    booking.channel = req.session.channelId;
    booking.service = i / 2 == 0 ? "57bab6182c58e00b7b8906d4" : "57bab7a03334bdd67ec90062";
    booking.branch = i / 2 == 0 ? "57bac09e196cd5400e6fa980" : "5751434bae64826e616374ff";
    booking.datetime = new Date();
    booking.submitTime = new Date();
    booking.status = "01";
    var user = {};
    user.mobile = '1358550978'+i;
    user.fullname = '测试！';
    booking.user = user;
    booking.save(function (err, booking) {
      console.log(booking);
    });
  }
  res.send("初始化值成功！");
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  var branch = req.query.branch;
  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var status = req.query.status;
  var init = req.query.init;
  var query = {};

  if (branch) {
    query.branch = branch;
  }
  if (fullname) {
    var name = {'user.fullname': {$regex: fullname}};
    query = _.assign(query, name);
  }
  if (mobile) {
    var name = {'user.mobile': mobile};
    query = _.assign(query, name);
  }
  if (status) {
    query.status = "02";
  }else{
    query.status = "01";
  }
  query.channel = req.session.channelId;
  if (!init) {
    query.status = "01";
    var start = new Date(moment().add('Days', -1).format("YYYY-MM-DD 00:00:00"));
    var end = new Date(moment().format("YYYY-MM-DD HH:mm:ss"));
    query.datetime = {$gte: start, $lt: end}
  }
  BookingRecord.dataTable(req.query, {conditions: query}, function (err, data) {
    res.send(data);
  });
};
/**
 * 导出预约信息
 * @param req
 * @param res
 */
exports.export = function (req, res) {
  var branch = req.query.branch;
  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var query = {};
  if (branch) {
    query.branch = branch;
  }
  if (fullname) {
    var name = {'user.fullname': {$regex: fullname}};
    query = _.assign(query, name);
  }
  if (mobile) {
    var name = {'user.mobile': mobile};
    query = _.assign(query, name);
  }
  query.channel = req.session.channelId;

  var label = "网点" + "," + "	预约人" + "," + "手机号" + "," + "预约服务项" + "," + "预约时间" + "," + "提交时间" + "," + "状态" + "\n";

  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  getData(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "bookingUser" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(label);
  })
};

/**
 * 获取预约信息返回数据
 * @param query 查询数据的条件
 * @param callback
 */
function getData(query, callback) {
  //var
  BookingRecord.find(query).populate([{"path": "branch", "select": "name"},
    {"path": "service", "select": "serverName"}]).sort({'submitTime': 1}).exec(function (err, booking) {
    if (booking && booking.length > 0) {
      var bufs = "";
      booking.forEach(function (e) {
        var fullname = e.user.fullname ? e.user.fullname : " ";
        var mobile = e.user.mobile ? e.user.mobile : " ";
        var brachName = e.branch ? e.branch.name : "";
        var serverName = e.service ? e.service.serverName : "";
        var datetime = moment(e.datetime).format("YYYY-MM-DD HH:mm:ss")
        var submitTime = moment(e.submitTime).format("YYYY-MM-DD HH:mm:ss")
        var statuName = e.status == '01' ? "未处理" : "已处理";
        bufs += brachName + "," + fullname + "," + mobile + "\t," + serverName + "," + datetime + "\t," + submitTime + "\t," + statuName + "\n";
      });
      callback(null, bufs);
    } else {
      callback(err, null);
    }
  });
}

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  BookingRecord.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/bank/booking/list');
    }
  });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.serverName;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    BookingRecord.count({name: newName}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.feedback = function (req, res) {

  var ids = req.body.ids;
  var feedback = req.body.feedback;
  ids = ids.split(',');
  console.log(ids);
  for (var i in ids) {
    BookingRecord.update({'_id': ids[i]}, {feedback: feedback, status: '02'}, function (err, result) {
      if (err) {
        console.error(err);
        req.flash('error', '处理失败！');
        res.redirect('/bank/booking/list');
        return;
      }
    });
  }
  req.flash('success', '处理成功!');
  res.redirect('/bank/booking/list');
};
