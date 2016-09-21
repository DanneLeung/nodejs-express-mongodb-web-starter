/**
 * Created by danne on 2016-04-28.
 */
/**
 * 线下活动报名
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');

var Event = require('./event.model');
var EventApply = require('./event.apply.model');
var EventUser = require('./event.user.model');

var excal = require('excel-export');

/**
 * 报名用户列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  var eventId = req.params.eventId;
  Event.findById(eventId, function (err, event) {
    if (handleErr(req, err)) {
      var formfield = [];
      for (var i = 0; i < event.formfield.length; i++) {
        formfield.push(event.formfield[i].name)
      }
      res.render('activities/event/signUserList', {event: event});
      return;
    } else {
      res.redirect('/activities/event');
    }
  });
};


/**
 * 获取活动列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  EventUser.dataTable(req.query, {conditions: {'eventId': req.params.eventId}}, function (err, data) {
    res.send(data);
  });
};

/**用户报名
 * @param req
 * @param res
 */
exports.sign = function (req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (handleErr(req, err)) {
      res.render('activities/event/signForm', {eventId: req.params.eventId, event: event});
      return;
    }
    else {
      res.redirect('/activities/event');
    }
  })
};

/**用户报名提交
 * @param req
 * @param res
 */
exports.save = function (req, res) {

  if (typeof req.body._csrf !== 'undefined') {
    delete req.body._csrf;
  }
  var form = [];
  for (var key in req.body) {
    form.push({'key': key, 'value': req.body[key]});
    delete req.body[key];
  }
  req.body.form = form;
  req.body['eventId'] = req.params.eventId;
  req.body['wechatNickname'] = '空城';
  var eventUser = new EventUser(req.body);
  eventUser.save(function (err, newEventUser) {
    if (err) {
      return;
    }
  });
  res.redirect('/activities/event/users/' + req.params.eventId);
};

/**
 * 处理错误，如果没有错误返回true，可以进行下一步，否则返回false
 * @param req
 * @param res
 * @param err
 * @param msg
 */
function handleErr(req, err, msg) {
  if (err) {
    req.flash('error', msg ? msg : err);
    return false;
  }
  return true;
}

// handle object saved
function handleSaved(req, res, err, eventUser) {
  if (err) {
    req.flash('error', '保存失败!' + err);
    res.render('activities/event/eventForm', {
      eventUser: eventUser == null ? new EventUser : eventUser
    });
  } else {
    req.flash('success', '保存成功!');
    res.redirect('/activities/event');
  }
}

/**
 * 获取导出的数据信息
 * @param req
 * @param res 循环的查询数据的值
 *
 */
exports.exportCsv = function (req, res) {
  var eventId = req.params.eventId;
  var query = {};
  query.eventId = eventId;
  var dateTime = req.body.dateTime;
  if (!dateTime) {  //默认导出前一天的用户信息
    var start = new Date(moment().add('days', -1).format('YYYY/MM/DD 00:00:00'));
    var end = new Date(moment().format('YYYY/MM/DD 00:00:00'));
    query.dateTime = {$gte: start, $lt: end}
  } else {  //根据时间范围获取导出的用户信息
    var eq = dateTime.split(' - ');
    var start1 = new Date(moment(eq[0]));
    var end1 = new Date(moment(eq[1]));
    query.dateTime = {$gte: start1, $lt: end1}
  }
  console.log("dateTime================", dateTime);
  console.log("query================", query);
  //先获取报名设置信息
  Event.findById(eventId, function (err, event) {
    var names = [];
    var labels = [];
    if (event) {
      //获取每一个字段和文件标题
      event.formfield.forEach(function (e) {
        labels.push(e.label)
        names.push(e.name);
      });
      labels.push("申请时间");
      var label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(labels.toString() + '\n')]);//处理乱码的格式
      var fn = function (label, index) {
        getEvent(names, query, index, function (err, data) {
          if (data) {
            label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
            index += 1;
            fn(label, index);
          } else {
            var filename = "eventUser" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + filename);
            res.end(label);
          }
        })
      }
      fn(label, 0);
    }
  });
}
/**
 * 获取用户的表达数据
 * @param req
 * @param names key值得集合
 * @param index 循环的查询数据的值
 * @param query 查询数据的条件
 * @param callback
 */
function getEvent(names, query, index, callback) {
  var skip = index * 100;
  var limit = skip + 100;
  //var
  EventUser.find(query).limit(limit).skip(skip).exec(function (err, event) {
    if (event && event.length > 0) {
      var bufs = "";
      event.forEach(function (e) {
        for (var i = 0; i <= names.length; i++) {
          var value = getValue(names[i], e.form)
          if (i == (names.length)) {
            bufs += moment(e.dateTime).format('YYYY-MM-DD HH:mm:ss') + "\t\n";
          } else {
            var values = value.split(',');
            if (values.length > 1) { //判断是否有多个值产生
              var a = "";
              for (var j = 0; j < values.length; j++) {
                if (j == 0) {
                  a += values[j]
                } else if(j == values.length-1){
                  a += "";
                }else{
                  a += "-" + values[j]
                }
              }
              bufs += a + ",";
            } else {
              bufs += value + ",";
            }
          }
        }
      });
      callback(null, bufs);
    } else {
      callback(err, null);
    }
  });
}

/**
 * 获取数组中对应kay值得value
 * @param key 验证的key值
 * @param forms key值得集合
 * @returns {*}
 */
function getValue(key, forms) {
  for (var i = 0; i < forms.length; i++) {
    if (forms[i].key == key) {
      return forms[i].value;
    }
  }
  return null;
}

