/**
 * Created by xingjie201 on 2016/3/18.
 */
var mongoose = require('mongoose')
  , ChargeOrder = mongoose.model('ChargeOrder');
var _ = require('lodash');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');

exports.list = function (req, res) {
  res.render('shop/order/chargeOrderList', {});
};

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  var querys = {};
  var mobile = req.query.mobile;
  var no = req.query.no;
  var type = req.query.type;
  var status = req.query.status;
  var times = req.query.times;
  if(mobile){
    querys.mobile = mobile;
  }
  if(no){
    querys.$or = [{no:no},{wxOrderNo:no}];
  }
  if(type){
    querys.type = type;
  }
  if(status){
    querys.status = status;
  }
  if(times){
    var op = times.split(" - ");
    var start = new Date(moment(op[0]));
    var end = new Date(moment(op[1]));
    querys.createdAt = {$gte:start,$lt:end};
  }
  ChargeOrder.dataTable(req.query, {conditions: querys}, function (err, data) {
    console.log(data);
    res.send(data);
  });
};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var title = req.query.title || req.body.title;
  var channelId = req.session.channelId;
  ChargeOrder.count({'channel': channelId, 'title': title}, function (err, result) {
    if (result > 0) {
      res.send('false');
    } else {
      res.send('true');
    }
  });
};

