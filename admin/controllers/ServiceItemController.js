/**
 * Created by danne on 2015/10/29.
 */
"use strict";

var mongoose = require('mongoose');
var ServiceItem = mongoose.model('ServiceItem');
var async = require('async');
var config = require('../../config/config');

/*
 * list
 */
exports.list = function (req, res) {
  ServiceItem.find({}, function (err, sitem) {
    res.render('serviceItem/serviceItemList', {
      sitem: sitem
    })
  })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  ServiceItem.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};
exports.add = function (req, res) {
  res.render('serviceItem/serviceItemForm', {
    viewType: "add",
    sitem: new ServiceItem()
  })
};

exports.edit = function (req, res) {
  var id = req.param("id");
  ServiceItem.findOne({'_id': id}, function (err, sitem) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/viproom/list');
    } else {
      res.render('serviceItem/serviceItemForm', {
        viewType: "edit",
        sitem: sitem
      })
    }
  });
};


exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ServiceItem.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/viproom/list');
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
    ServiceItem.count({name: newName}, function (err, result) {
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
exports.save = function (req, res) {
  var id = req.body.id;
  if (!id) {
    var sitem = new ServiceItem(req.body);
    sitem.save(function (err, result) {
      if(err){
        console.log("数据添加失败！");
        req.flash('error', '添加失败!');
      }else{
        req.flash('success', '添加成功!');
      }
      res.redirect('/viproom/list');
    });
  } else {
    // update
    ServiceItem.update({'_id': id}, req.body, function (err, result) {
      if(err){
        console.log("数据修改失败！");
        req.flash('error', '保存失败!');
      }else{
        req.flash('success', '保存成功!');
      }
        res.redirect('/viproom/list');
    });
  }

};
