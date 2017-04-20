/**
 * Created by xingjie201 on 2016/2/19.
 * 分类节点的Controller
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../../../config/config');
var Node = mongoose.model('Node');
var moment = require('moment');
var async = require('async');

/*
 * list
 */
exports.list = function (req, res) {
  Node.all((nodes) => {
    res.render('admin/bbs/node/nodeList', { nodes: nodes });
  });
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  Node.dataTable(req.query, {
    conditions: {}
  }, function (err, data) {
    res.send(data);
  });
};

/**
 * 修改分组信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Node.findOne({
    '_id': id
  }, function (err, node) {
    if(err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/admin/bbs/node');
    } else {
      res.render('admin/bbs/node/nodeForm', {
        node: node
      })
    }
  });
};

/**
 * 添加分组信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('admin/bbs/node/nodeForm', {
    node: new Node()
  })
};

/**
 * 检查分组名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if(newName === oldName) {
    res.send('true');
  } else {
    Node.count({
      'name': newName
    }, function (err, result) {
      if(result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 是否激活分类节点
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Node.findOne({ '_id': id }, function (err, info) {
    if(!err) {
      if(info.enabled == true) {
        updata.enabled = false;
        msg = "版块已禁用";
      } else {
        updata.enabled = true;
        msg = "版块已激活";
      }
      Node.update({ '_id': id }, updata, options, function (err, info) {
        if(!err) {
          req.flash('success', msg);
          res.redirect('/admin/bbs/node');
        }
      });
    }
  });
};
/**
 * 删除分类节点
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Node.remove({
    '_id': ids
  }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/admin/bbs/node');
    }
  });
};
/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  if(!req.body.enabled) req.body.enabled = false;
  if(!id) {
    var user = new Node(req.body);
    console.log("user======================>>>>>>>>>>>>>>>>", user);
    user.save(function (err, result) {
      console.log("err======================>>>>>>>>>>>>>>>>", err);
      if(err) {
        req.flash('error', err);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/admin/bbs/node');
    });
  } else {
    // update
    Node.update({
      '_id': id
    }, req.body, function (err, result) {
      if(err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/admin/bbs/node');
    });
  }
};