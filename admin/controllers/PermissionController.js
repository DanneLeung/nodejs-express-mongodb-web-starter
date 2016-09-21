/**
 * Created by danne on 2015/10/29.
 */
"use strict";

var mongoose = require('mongoose');
var Permission = mongoose.model('Permission');
var async = require('async');
var config = require('../../config/config');


/*
 * list
 */
exports.list = function (req, res) {
  Permission.find({}, function (err, users) {
    res.render('system/permission/permissionList', {
      users: users
    })
  })
};


/*permission list table json datasource*/
exports.datatable = function (req, res) {
  Permission.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};

exports.add = function (req, res) {
  res.render('system/permission/permissionForm', {
    viewType: "add"
  })
};

exports.edit = function (req, res) {
  var id = req.param("id");
  Permission.findOne({'_id': id}, function (err, permission) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/system/permission');
    } else {
      res.render('system/permission/permissionForm', {
        viewType: "edit",
        permission: permission
      })
    }
  });
};


exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Permission.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/permission');
    }
  });

};

/**
 * 检查权限名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Permission.count({name: newName}, function (err, result) {
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
    var permission = new Permission(req.body);
    permission.save(function (err, result) {
      handleSaved(req, res, err, permission, 'add');
    });
  } else {
    // update
    Permission.update({'_id': id}, req.body, function (err, result) {
      handleSaved(req, res, err, req.body, 'edit');
    });
  }
};

// handle object saved
function handleSaved(req, res, err, result, type) {
  if (err) {
    console.log(err);
    req.flash('error', '权限保存失败!');
    res.render('system/permission/permissionForm', {
      viewType: type,
      permission: result
    });
  } else {
    req.flash('success', '权限保存成功!');
    if (type === "add") {
      result.name = "";
      result.action = "";
      result.url = "";
      result.description = "";
      res.render('system/permission/permissionForm', {
        viewType: type,
        permission: result,
        urlPrefix: req.body.urlPrefix
      });
    } else {
      res.redirect('/system/permission');
    }
  }
}
