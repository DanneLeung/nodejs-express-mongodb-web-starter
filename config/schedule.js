/**
 * Created by yu869 on 2015/12/18.
 */

var mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId
var Order = mongoose.model('Order');
var VipRoom = mongoose.model('VipRoom');
var OrderDay = mongoose.model('OrderDay');
var OrderToday = mongoose.model('OrderToday');
var OrderMonth = mongoose.model('OrderMonth');
var OrderCurMonth = mongoose.model('OrderCurMonth');

var express = require('express');
var moment = require('moment');

var config = require('./config');
var schedule = require('node-schedule');

module.exports = function (app) {

  console.log("schedule init");

  /**
   * 每隔5分钟统计当日订单
   */
  var i = schedule.scheduleJob("*/30 * * * *", function () {
    console.log("schedule init getVipRoomToday(1)分钟");
    getVipRoomToday();

  });

  /**
   * 每天1点00分统计前一天的休息室订单
   */
  var j = schedule.scheduleJob("0 0 1 */1 * *", function () {
    console.log("schedule init getVipRoomDay(每天1点00分统计前一天的休息室订单)");
    getVipRoomDay();
  });

  /**
   * 每月一日6点00分按月份统计每个休息室的订单
   */
  var c = schedule.scheduleJob("0 0 6 1 */1 *", function () {
    console.log("schedule init saveOrderMonth( 每月一日6点00分按月份统计每个休息室的订单)");
    saveOrderMonth();
  });
  /**
   * 每日 02:00:00统计休息室的订单
   */
  var d = schedule.scheduleJob("0 0 2 */1 * *", function () {
    console.log("schedule init saveOrderCurMonth(每日 02:00:00统计休息室的订单)");
    saveOrderCurMonth();
  });
};

/**
 * 按店铺和月临时统计订单
 * @param req
 * @param res
 */
function saveOrderCurMonth() {
  //删除原来的统计记录
  OrderCurMonth.remove({}, function (err, result) {
    if (!err) {
      console.log('删除成功');
    }
  });
  var months = moment().format("YYYY/MM/01 08:00:00");
  var m = new Date(months);
  getOrderCurMonth(function (err, doce) {
    doce.forEach(function (e) {
      var curMonth = new OrderCurMonth({
        viproomId: e._id.viproomId,
        viproomName: e._id.viproomName,
        counts: e.counts,
        amount: e.amount,
        amountPaid: e.amountPaid,
        total: e.total,
        noPayNum: e.noPayNum, //待支付的
        payNum: e.payNum, //已支付
        payFailNum: e.payFailNum,//支付失败
        usingNum: e.usingNum,//使用中
        completedNum: e.completedNum,//完成
        cancelNum: e.cancelNum //撤销
        , month: m
      });
      curMonth.save(function (err, fran) {
        if (err) {
          console.log("=================");
          console.log(err.message);
        }
      });
    })
    console.log("当前月份的订单统计");
  });
};
/**
 * 按洗衣房统计当月的订单
 * @param deviceId
 */
function getOrderCurMonth(callback) {

  //获取当前时间  YYYY/MM/DD 00:00:00 用于查看当天订单
  var a = moment().format("YYYY/MM/01 00:00:00");
  var b = moment().add('months', +1).format("YYYY/MM/01 00:00:00");
  var start = new Date(a);
  var end = new Date(b);
  console.log(mongoose.connection.collections['orderDays']);
  mongoose.connection.collections['orderDays'].aggregate(
    [
      {$match: {day: {$gte: start, $lt: end}}},
      {
        $group: {
          "_id": {
            "viproomId": "$viproomId",
            "viproomName": "$viproomName"
          },
          "counts": {$sum: "$counts"},
          "amount": {$sum: "$amount"},
          "total": {$sum: "$total"},//总订单数
          "amountPaid": {$sum: "$amountPaid"},//支付金额
          "noPayNum": {$sum: "$noPayNum"},//未支付订单数 01
          "payNum": {$sum: "$payNum"},//已支付 02
          "payFailNum": {$sum: "$payFailNum"},//未支付订单数 03
          "usingNum": {$sum: "$usingNum"},//使用中订单数 04
          "completedNum": {$sum: "$completedNum"},//已完成订单数 05
          "cancelNum": {$sum: "$cancelNum"}//已取消订单数 06
        }
      }
    ]
  ).toArray(function (err, result) {
    callback(err, result);
  });
}


function saveOrderMonth() {
  var month = moment().add('months', -1).format("YYYY/MM/01 08:00:00");
  console.log("++++++++++++++++++++++++++++++++++++++++");
  console.log(month);
  var m = new Date(month);
  getOrderMonth(function (err, doce) {
    doce.forEach(function (e) {
      var month = new OrderMonth({
        viproomId: e._id.viproomId,
        viproomName: e._id.viproomName,
        counts: e.counts,
        amount: e.amount,
        amountPaid: e.amountPaid,
        total: e.total,
        noPayNum: e.noPayNum, //待支付的
        payNum: e.payNum, //已支付
        payFailNum: e.payFailNum,//支付失败
        usingNum: e.usingNum,//使用中
        completedNum: e.completedNum,//完成
        cancelNum: e.cancelNum //撤销
        , month: m
      });
      month.save(function (err, fran) {
        if (err) {
          console.log(err.message);
        }
      });
    })
    console.log("按月统计订单");
  });

}


/**
 * 在月初时统计上月份的休息室订单
 * @param deviceId
 */
function getOrderMonth(callback) {

  //获取当前时间  YYYY/MM/DD 00:00:00 用于查看当天订单
  var a = moment().add('months', -1).format("YYYY/MM/01 00:00:00");
  var b = moment().format("YYYY/MM/01 00:00:00");
  var start = new Date(a);
  var end = new Date(b);
  var s = null;
  console.log(mongoose.connection.collections['orderDays']);
  mongoose.connection.collections['orderDays'].aggregate(
    [
      {$match: {day: {$gte: start, $lt: end}}},
      {
        $group: {
          "_id": {
            "viproomId": "$viproomId",
            "viproomName": "$viproomName"
          },
          "counts": {$sum: "$counts"},
          "amount": {$sum: "$amount"},
          "total": {$sum: "$total"},//总订单数
          "amountPaid": {$sum: "$amountPaid"},//支付金额
          "noPayNum": {$sum: "$noPayNum"},//未支付订单数 01
          "payNum": {$sum: "$payNum"},//已支付 02
          "payFailNum": {$sum: "$payFailNum"},//支付失败 03
          "usingNum": {$sum: "$usingNum"},//使用中订单数 04
          "completedNum": {$sum: "$completedNum"},//已完成订单数 05
          "cancelNum": {$sum: "$cancelNum"}//已取消订单数 06
        }
      }
    ]
  ).toArray(function (err, result) {
    callback(err, result);
  });
}


/**
 *根据休息室统计前一天的订单
 * @param storeId
 * @param collback
 */
function getVipRoomDay() {
  var a = moment().add('days', -1).format("YYYY/MM/DD 08:00:00");
  var day = new Date(a);
  VipRoom.find({}, function (err, doce) {
    if (doce != null && doce != '') {
      var fn = function (doce) {
        var pop = doce.pop();
        getOrderGroup(pop._id, function (err, orders) { //根据设备获取订单分组文档
          var orderDay = new OrderDay({
            viproomId: pop._id,
            viproomName: pop.name,
            counts: orders.counts,
            amount: orders.amount,
            amountPaid: orders.amountPaid,
            total: orders.total,
            noPayNum: orders.noPayNum, //待支付的
            payNum: orders.payNum, //已支付
            payFailNum: orders.payFailNum,//支付失败
            usingNum: orders.usingNum,//使用中
            completedNum: orders.completedNum,//完成
            cancelNum: orders.cancelNum,//撤销
            day: day //统计日期
          });
          orderDay.save(function (err, docs) {
            if (err) {
              console.log("====================================");
              console.log(err);
              console.log("保存失败");
            }
          });
          if (doce.length > 0) {
            fn(doce);
          } else {
            console.log("统计完成");
          }
        });
      };
      fn(doce);
    } else {
      console.log("没有休息室");
    }
  });

}


/**
 * 根据休息室的ID获取不同状态的统计 时间为前一天
 * @param deviceId
 */
function getOrderGroup(roomId, collback) {

  //获取当前时间  YYYY/MM/DD 00:00:00 用于查看当天订单
  var d = moment().add('days', -1).format("YYYY/MM/DD 00:00:00");
  var a = moment().format("YYYY/MM/DD 00:00:00");
  var start = new Date(d);
  var end = new Date(a);

  //分组查询数据
  mongoose.connection.collections['orders'].group({"status": true}, {
      "viproomId": ObjectId(roomId),
      "orderType": '01',
      "createdAt": {$gte: start, $lt: end}
    }, {"counts": 0, "amount": 0, "amountPaid": 0, "num": 0}
    , function (obj, prev) {   //统计每组的数量，支付金额，金额
      prev.num++;
      prev.counts += obj.counts;
      prev.amount += obj.amount;
      prev.amountPaid += obj.amountPaid;
    }
    , true
    , function (err, results) {  //返回结果
      var result =
      {
        counts: 0,
        amount: 0,
        amountPaid: 0,
        total: 0,
        noPayNum: 0, //待支付的
        payNum: 0, //已支付
        payFailNum: 0,//支付失败
        usingNum: 0,//使用中
        completedNum: 0,//完成
        cancelNum: 0//撤销
      };
      for (var i in results) {
        switch (results[i].status) {
          case '01':
            result.noPayNum += results[i].num;
            break;
          case '02':
            result.payNum += results[i].num;
            break;
          case '03':
            result.payFailNum += results[i].num;
            break;
          case '04':
            result.usingNum += results[i].num;
            break;
          case '05':
            result.completedNum += results[i].num;
            break;
          case '06':
            result.cancelNum += results[i].num;
            break;
          default:
            break;
        }
        result.total += results[i].num;
        // Calculation of Sum(Quantity)          result.amount += results[i].amount;
        // Calculation of Sum(Sales)
        result.counts += results[i].counts;
        result.amount += results[i].amount;
        result.amountPaid += results[i].amountPaid;
      }
      collback(err, result);
    });
}

/**
 *根据休息室统计当天的订单
 * @param storeId
 * @param collback
 */
function getVipRoomToday() {

  //删除原来的统计记录
  OrderToday.remove({}, function (err, result) {
    if (!err) {
      console.log('删除成功');
    }
  });
  var a = moment().format("YYYY/MM/DD 08:00:00");
  var day = new Date(a);
  VipRoom.find({}, function (err, doce) {
    if (doce != null && doce != '') {
      var fn = function (doce) {
        var pop = doce.pop();
        getOrderGroupToday(pop._id, function (err, orders) { //根据设备获取订单分组文档
          var orderToday = new OrderToday({
            viproomId: pop._id,
            viproomName: pop.name,
            counts: orders.counts,
            amount: orders.amount,
            amountPaid: orders.amountPaid,
            total: orders.total,
            noPayNum: orders.noPayNum, //待支付的
            payNum: orders.payNum, //已支付
            payFailNum: orders.payFailNum,//支付失败
            usingNum: orders.usingNum,//使用中
            completedNum: orders.completedNum,//完成
            cancelNum: orders.cancelNum,//撤销
            day: day //统计日期
          });
          orderToday.save(function (err, docs) {
            if (err) {
              console.log("保存失败");
            }
          });
          if (doce.length > 0) {
            fn(doce);
          } else {
            console.log("统计完成");
          }
        });
      };
      fn(doce);
    } else {
      console.log("没有休息室");
    }
  });

}


/**
 * 根据休息室的ID获取不同状态的统计 时间为当天
 * @param deviceId
 */
function getOrderGroupToday(roomId, collback) {

  //获取当前时间  YYYY/MM/DD 00:00:00 用于查看当天订单
  var d = moment().format("YYYY/MM/DD 00:00:00");
  var start = new Date(d);
  //分组查询数据
  mongoose.connection.collections['orders'].group({"status": true}, {
      "viproomId": ObjectId(roomId),
      "orderType": '01',
      "createdAt": {$gte: start}
    }, {"counts": 0, "amount": 0, "amountPaid": 0, "num": 0}
    , function (obj, prev) {   //统计每组的数量，支付金额，金额
      prev.num++;
      prev.counts += obj.counts;
      prev.amount += obj.amount;
      prev.amountPaid += obj.amountPaid;
    }
    , true
    , function (err, results) {  //返回结果
      var result =
      {
        counts: 0,
        amount: 0,
        amountPaid: 0,
        total: 0,
        noPayNum: 0, //待支付的
        payNum: 0, //已支付
        payFailNum: 0,//支付失败
        usingNum: 0,//使用中
        completedNum: 0,//完成
        cancelNum: 0//撤销
      };
      for (var i in results) {
        switch (results[i].status) {
          case '01':
            result.noPayNum += results[i].num;
            break;
          case '02':
            result.payNum += results[i].num;
            break;
          case '03':
            result.payFailNum += results[i].num;
            break;
          case '04':
            result.usingNum += results[i].num;
            break;
          case '05':
            result.completedNum += results[i].num;
            break;
          case '06':
            result.cancelNum += results[i].num;
            break;
          default:
            break;
        }
        result.total += results[i].num;
        // Calculation of Sum(Quantity)          result.amount += results[i].amount;
        // Calculation of Sum(Sales)
        result.counts += results[i].counts;
        result.amount += results[i].amount;
        result.amountPaid += results[i].amountPaid;
      }
      collback(err, result);
    });
}
