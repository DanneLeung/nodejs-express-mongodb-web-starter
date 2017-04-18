/**
 * Created by xingjie201 on 2016/2/19.
 * 帖子的Controller
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../../../config/config');
var Topic = mongoose.model('Topic');
var moment = require('moment');
var async = require('async');

/*
 * list
 */
exports.list = function (req, res) {
  res.render('admin/bbs/topic/topicList');
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  Topic.dataTable(req.query, {
    conditions: {}
  }, function (err, data) {
    res.send(data);
  });
};

/**
 * 修改帖子信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Topic.findOne({
    '_id': id
  }, function (err, topic) {
    if(err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/admin/bbs/topic');
    } else {
      res.render('admin/bbs/topic/topicForm', {
        topic: topic
      });
    }
  });
};

/**
 * 添加帖子信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('admin/bbs/topic/topicForm', {
    topic: new Topic()
  });
};

/**
 * 是否激活帖子
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Topic.findOne({
    '_id': id
  }, function (err, info) {
    if(!err) {
      if(info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用";
      } else {
        updata.enabled = true;
        msg = "已激活";
      }
      Topic.update({
        '_id': id
      }, updata, options, function (err, info) {
        if(!err) {
          req.flash('success', msg);
          res.redirect('/admin/bbs/topic');
        }
      });
    }
  });
};
/**
 * 删除帖子
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var id = req.body.id || req.params.id || req.query.id;
  Topic.remove({
    '_id': id
  }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/admin/bbs/topic');
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
  req.body.user = req.user;
  if(!id) {
    var user = new Topic(req.body);
    console.log("user======================>>>>>>>>>>>>>>>>", user);
    user.save(function (err, result) {
      console.log("err======================>>>>>>>>>>>>>>>>", err);
      if(err) {
        req.flash('error', err);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/admin/bbs/topic');
    });
  } else {
    // update
    Topic.update({
      '_id': id
    }, req.body, function (err, result) {
      if(err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/admin/bbs/topic');
    });
  }
};