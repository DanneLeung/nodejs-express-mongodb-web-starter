/**
 * Created by yu869 on 2016/1/13.
 */
"use strict";

var mongoose = require('mongoose');
var Setting = mongoose.model('Setting');
var async = require('async');
var config = require('../../config/config');
var moment = require('moment');
var url = require('url');
var PaymentMethod = mongoose.model('PaymentMethod');
var SmsSetting = mongoose.model('SmsSetting');

exports.list = function(req, res) {
  res.render('system/setting/settingList', {});
};

exports.dataTable = function(req, res) {
  Setting.dataTable(req.query, function(err, data) {
    res.send(data);
  });
};

exports.add = function(req, res) {
  res.render('system/setting/settingForm', {
    viewType: "add"
  });
};

exports.checkName = function(req, res) {
  var newKey = req.query.key;
  var oldKey = req.query.oldKey;
  console.log("newKey ======================>" + newKey);
  console.log("oldKey ======================>" + oldKey);
  if(newKey === oldKey) {
    res.send('true');
  } else {
    Setting.count({ key: newKey }, function(err, result) {
      if(result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.save = function(req, res) {
  var id = req.body.id;
  if(!id) {
    var setting = new Setting(req.body);
    setting.save(function(err, result) {
      if(err) {
        req.flash('error', '添加失败!');
      } else {
        req.flash('success', '添加成功!');
      }
      res.redirect('/system/setting');
    });
  } else {
    // update
    Setting.update({ '_id': id }, req.body, function(err, result) {
      if(err) {
        req.flash('error', '保存失败!');
      } else {
        req.flash('success', '保存成功!');
      }
      res.redirect('/system/setting');
    });
  }

};

exports.edit = function(req, res) {
  var id = req.params.id;
  Setting.findOne({ '_id': id }, function(err, setting) {
    if(err) {
      res.redirect('/system/setting');
    } else {
      res.render('system/setting/settingForm', {
        viewType: "edit",
        setting: setting
      })
    }
  });
};

exports.del = function(req, res) {
  var ids = req.body.ids || req.params.ids;
  Setting.remove({ '_id': ids }, function(err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/setting');
    }
  });
};

exports.init = function(req, res) {
  Setting.remove();
  var setting = new Setting({
    key: 'key',
    value: 'value',
    describe: '中文描述'
  });
  setting.save();
  res.redirect('/system/setting');
};
