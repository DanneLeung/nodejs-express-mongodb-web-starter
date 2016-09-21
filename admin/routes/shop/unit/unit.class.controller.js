/**
 * Created by xingjie201 on 2016/3/18.
 */
'use strict';
var mongoose = require('mongoose');
var UnitClass = mongoose.model('UnitClass');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');
var async = require('async');
var utility = require('utility');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');


exports.list = function (req, res) {
  res.render('shop/unit/list');
};

exports.add = function (req, res) {
  res.render('shop/unit/form', {unit: new UnitClass()});
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  UnitClass.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/unit/list');
    }
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  UnitClass.findById(id).exec(function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', '外链商品不存在，可能已被删除!');
      res.redirect('/shop/unit/list');
    } else {
      res.render('shop/unit/form', {unit: result});
    }
  });
};

/**
 * 保存数据
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.channel = req.session.channelId;

  //新增或者更新
  var saveOrUpdate = function (id, req, callback) {
    UnitClass.findByIdAndUpdate(id, req.body, {new: true, upsert: true}, function (err, p) {
      callback(err, p);
    });
  };
  var handleResult = function (err, p) {
    if (err) {
      req.flash('error', '保存数据时发生异常.');
      return res.render('shop/unit/form', {unit: req.body});
    }
    console.log("*********** 外链商品保存成功，", p);
    req.flash('success', '数据保存成功!');
    res.redirect('/shop/unit/list');
  };

  saveOrUpdate(id, req, handleResult);

};

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  var channel = req.session.channelId;
  //排序筛选条件
  var querys = {};
  if (channel) {
    querys.channel = channel;
  }
  UnitClass.dataTable(req.query, {conditions: querys}, function (err, data) {
    res.send(data);
  });
};

/**
 * 单位标题是否已经存在
 */
exports.checkTitle = function (req, res) {
  var title = req.query.title;
  var oldTitle = req.query.oldTitle;
  if (title === oldTitle) {
    res.send('true');
  } else {
    UnitClass.count({'title': title, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 根据类型获取单位数据
 */
exports.getUnits = function (req, res) {
  var type = req.query.type || req.body.type;
  UnitClass.find({'type': type, channel: req.session.channelId}, function (err, units) {
    res.send(units);
  });
};


