/**
 * Created by danne on 2016-04-28.
 */
/**
 * 贷款申请数据
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var validator = require('validator');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');
var Loan = require('./loan.model');
var LoanType = require('./loan.type.model');
var LoanSett = require('./loan.setting.model');
var LoanAppl = require('./loan.application.model');


/**
 * datatable
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  LoanAppl.dataTable(req.query, {conditions: {'channel': req.session.channelId}}, function (err, data) {
    res.send(data);
  });
};

/**
 * list
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  LoanSett.findOne({
    channel: req.session.channelId
  }, function (err, setting) {
    if (err || !setting) {
      req.flash('error', '查找页面设置时出错');
      return res.redirect('/bank/loan/setting');
    }
    //处理自定义字段
    var fields = [];
    if (setting.fields.name) {
      fields.push('姓名');
    }
    if (setting.fields.company) {
      fields.push('公司名称');
    }
    if (setting.fields.recommend) {
      fields.push('推荐人(选填)');
    }
    if (setting.fields.gender) {
      fields.push('性别');
    }
    if (setting.fields.email) {
      fields.push('邮箱');
    }
    res.render('bank/loan/appl/list', {fields: fields});
  });

};

/**
 * 获取导出的数据信息
 * @param req
 * @param res 循环的查询数据的值
 *
 */
exports.exportCsv = function (req, res) {
  var eventId = req.params.eventId;
  var query = {};
  var dateTime = req.body.dateTime;
  if (!dateTime) {  //默认导出前一天的用户信息
    var start = new Date(moment().format('YYYY/MM/DD 00:00:00'));
    var end = new Date(moment().add('days', 1).format('YYYY/MM/DD 00:00:00'));
    query.time = {$gte: start, $lt: end}
  } else {  //根据时间范围获取导出的用户信息
    var eq = dateTime.split(' - ');
    var start1 = new Date(moment(eq[0]));
    var end1 = new Date(moment(eq[1]));
    query.time = {$gte: start1, $lt: end1}
  }
  console.log("dateTime================", dateTime);
  console.log("query================", query);
  //先获取报名设置信息

  async.waterfall([function (dome) {  //生成文件的标题
    LoanSett.findOne({
      channel: req.session.channelId
    }, function (err, setting) {
      //处理自定义字段
      var result = {};
      var keys = [];
      var fields = [];
      fields.push('微信昵称');
      fields.push('手机号');
      fields.push('姓名');
      fields.push('公司');
      if (setting.fields.recommend) {
        fields.push('推荐人(选填)');
        keys.push('recommend');
      }
      if (setting.fields.gender) {
        keys.push('gender');
        fields.push('性别');
      }
      if (setting.fields.email) {
        keys.push('email');
        fields.push('邮箱');
      }
      fields.push('申请日期');
      fields.push('申请产品');


      result.fields = fields;
      result.keys = keys;
      dome(err, result);
    });
  }, function (result, callback) {  //获取产品申请中的数据
    getEvent(result.keys, query, function (err, data) {
      console.log("data=======================", data);
      if (data) {
        result.data = data;
        callback(err, result);
      } else {
        callback(err, result);
      }
    })

  }], function (err, result) { //导出数据csv文件
    var label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(result.fields.toString() + '\n')]);//处理乱码的格式
    if (result.data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(result.data)]);//处理乱码的格式
      var filename = "eventUser" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
      res.setHeader('Content-Type', 'application/vnd.openxmlformats');
      res.setHeader("Content-Disposition", "attachment; filename=" + filename);
      res.end(label);
    }
  })

}

/**
 * 获取用户的表达数据
 * @param req
 * @param names key值得集合
 * @param index 循环的查询数据的值
 * @param query 查询数据的条件
 * @param callback
 */
function getEvent(keys, query, callback) {
  console.log("keys================", keys);
  //var
  LoanAppl.find(query).exec(function (err, loans) {
    if (loans && loans.length > 0) {
      var bufs = "";
      var len = (parseInt(keys.length) + parseInt(2));
      loans.forEach(function (e) {
        bufs += e.user.nickName + "," + e.user.mobile + "\t," + e.user.name + "," + e.company + ",";
        for (var i = 0; i < len; i++) {
          if (i == (keys.length)) {
            bufs += moment(e.time).format('YYYY-MM-DD HH:mm:ss') + "\t,";
          } else if (i == parseInt(keys.length) + parseInt(1)) {//处理最后一个参数
            if (e.loan.length > 0) { //判断是否有多个值产生
              var a = "";
              for (var j = 0; j < e.loan.length; j++) { //循环显示申请的产品
                if (j == e.loan.length - 1) {
                  a += e.loan[j].name + ".";
                } else {
                  a += e.loan[j].name + ";";
                }
              }
              bufs += a + "\n";
            } else {
              bufs += "无" + "\n";
            }
          } else {
            var value = getValue(keys[i], e.fields)
            bufs += value + "\t,";
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
  return "";
}


