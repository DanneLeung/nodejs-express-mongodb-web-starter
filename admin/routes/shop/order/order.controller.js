/**
 * Created by xingjie201 on 2016/3/18.
 */
var mongoose = require('mongoose')
var _ = require('lodash');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
var Order = mongoose.model('Order');

exports.list = function (req, res) {
  res.render('shop/order/orderList', {});
};

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  var querys = setQuery(req, res);

  Order.dataTable(req.query, {conditions: querys}, function (err, data) {
    console.log(data);
    res.send(data);
  });
};

/**
 * 初始化订单数据
 * @param req
 * @param res
 */
exports.inits = function (req, res) {
  for (var i = 0; i < 10; i++) {
    var order = new Order({
      channel: req.session.channelId,
      no: "20160918" + i,
      mobile: "1358550978" + i,
      total: 100,
      totalPaid: 100,
      status: "02",
      npayStatuso: "21",
      deliveryStatus: "30",
      isRefuse: false,
      refundStatus: "50"
    });
    order.save(function (err, order) {
      console.log(order);
    });
  }
  res.redirect('/shop/order/');
};

/**
 * 由于条件查询查询将重用，单独设置以便重复使用
 * @param req
 * @param res
 */
function setQuery(req, res) {
  var query = {};
  var mobile = req.query.mobile;
  var no = req.query.no;
  var payStatus = req.query.payStatus;
  var deliveryStatus = req.query.deliveryStatus;
  var refundStatus = req.query.refundStatus;
  var isRefuse = req.query.isRefuse;
  var status = req.query.status;
  var times = req.query.times;
  if (mobile) {
    query.mobile = mobile;
  }
  if (no) {
    query.no = no;
  }
  if (payStatus) {
    query.payStatus = payStatus;
  }
  if (deliveryStatus) {
    query.deliveryStatus = deliveryStatus;
  }
  if (refundStatus) {
    query.refundStatus = refundStatus;
  }
  if (isRefuse) {
    query.isRefuse = isRefuse;
  }
  if (status) {
    query.status = status;
  }
  if (times) {
    var op = times.split(" - ");
    var start = new Date(moment(op[0]));
    var end = new Date(moment(op[1]));
    query.time = {$gte: start, $lt: end};
  }
  query.channel = req.session.channelId;


  return query;

}
/**
 * 删除订单
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  if (ids) {
    ids = ids.split(',');
  }
  Order.remove({_id: {'$in': ids}}, function (err, result) {
    if (!err) {
      req.flash('success', "删除成功！");
    } else {
      req.flash('error', "删除失败！");

    }
    res.redirect('/shop/order/');
  });
};
/**
 * 查看订单
 * @param req
 * @param res
 */
exports.views = function (req, res) {
  var id = req.body.id || req.params.id;
  Order.findOne({'_id': id}).populate([
    {"path": "member", "select": "username"},
    {"path": "paymentMethod", "select": "name"}
  ]).exec(function (err, order) {
    if (order) {
      res.render('shop/order/orderView', {order: order});
    } else {
      req.flash('error', "订单被删除或者未找到");
      res.redirect('/shop/order/');
    }
  });
};

/**
 * 发货处理
 * @param req
 * @param res
 */
exports.publish = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  if (ids) {
    ids = ids.split(',');
  }
  var msgs = '';
  Order.find({_id: {'$in': ids}}, function (err, orders) {
    if (orders) {
      for (var i in orders) {
        if (orders[i].status == '02' && orders[i].payStatus == '25' && orders[i].refundStatus == '50') {
          Order.update({_id: orders[i]._id}, {deliveryStatus: "32"}, function (err, order) {
            if (err) {
              console.log(err);
            }
          });
        } else {
          msgs += i != orders.length - 1 ? orders[i].no + "," : orders[i].no + ".";
        }
      }
    }
    if (msgs) {
      req.flash('error', msgs + "这些订单不符合发货的条件，请检查；其他已发货");
    } else {
      req.flash('success', "已发货");
    }

    res.redirect('/shop/order/');
  });
};

/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.export = function (req, res) {
  var label = "订单号" + "," + "会员名" + "," + "手机号码" + "," + "应付总额" + "," + "已付金额" + "," + "下单时间" + ","
    + "支付状态" + "," + "配送状态" + "," + "退款申请" + "," + "订单状态" + "," + "购买商品" + "\n";
  var query = setQuery(req, res);
  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  getEvent(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "order" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
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
  Order.find(query).sort({'time': -1}).populate('member').exec(function (err, orders) {
    if (orders && orders.length > 0) {
      var bufs = "";
      for (var i in orders) {
        var o = orders[i];
        var no = o.no + "\t";
        var username = o.member ? o.member.username : "";
        var mobile = o.mobile + "\t";
        var total = o.total.toFixed(2) + "\t";
        var totalPaid = o.totalPaid.toFixed(2) + "\t";
        var time = moment(o.time).format("YYYY-MM-DD HH:mm:ss") + "\t";
        var payStatus = o.payStatus == '21' ? "未支付" : o.payStatus == '22' ? "部分支付" : o.payStatus == '25' ? "全部支付" : "";
        var deliveryStatus = o.deliveryStatus == '30' ? "未发货" : o.deliveryStatus == '31' ? "部分发货" : o.deliveryStatus == '32' ? "全部发货" : "无需配送";
        var refundStatus = o.refundStatus == '50' ? "无申请" : o.refundStatus == '51' ? "要求退款" : "已退款";
        var status = o.status == '01' ? "待支付" : o.status == '02' ? "已支付" : o.status == '03' ? "支付失败" : o.status == '04' ? "使用中" : o.status == '05' ? "完成" : "退款";
        var product = '';
        for (var j = 0; j < o.products.length; j++) {
          product += o.products[j].name + ";";
        }
        bufs += no + "," + username + "," + mobile + "," + total + "," + totalPaid + "," + time + "," + payStatus + ","
          + deliveryStatus + "," + refundStatus + "," + status + "," + product + "\n";
      }
      callback(null, bufs);
    } else {
      callback(err, null);
    }
  });
}


