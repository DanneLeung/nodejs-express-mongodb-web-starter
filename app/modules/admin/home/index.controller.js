'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
var async = require('async');

var User = mongoose.model('User');

exports.profile = function (req, res) {
  var username = req.params.username;
  User.findOne({
    username: username
  }, (err, user) => {
    if(err) {
      console.error(err);
      req.flash('error', err);
    }
    res.render('admin/users/profile', {
      user: user
    });
  });
};

/**
 * 修改用户资料
 * @param req
 * @param res
 */
exports.updateProfile = function (req, res) {
  var id = req.body.id;
  console.log(req.body);
  if(id) {
    // update
    User.update({
      '_id': id
    }, req.body, function (err, result) {
      if(err) {
        res.send({
          err: true,
          msg: err
        });
      } else {
        res.send({
          err: false,
          msg: '保存个人资料成功'
        });
      }
    });
  }
};

/**
 * 修改用户密码
 * @param req
 * @param res
 */
exports.changePwd = function (req, res) {
  var id = req.body.id || req.user.id;
  var oldPwd = req.body.oldPwd;
  var newPwd = req.body.newPwd;
  var affirmPwd = req.body.affirmPwd;
  console.log(req.body);
  if(id) {
    User.findOne({
      _id: id
    }, function (err, user) {
      if(!user || !user.authenticate(oldPwd)) {
        res.status(200).send({
          err: '原登录密码错误，请重新输入!'
        });
      } else {
        if(newPwd === affirmPwd) {
          user.password = newPwd;
          user.save(function (err, ff) {
            res.status(200).send({
              err: ''
            });
          });
        } else {
          res.status(200).send({
            err: '新密码和确认密码不一致!'
          });
        }
      }
    });
  } else {
    res.status(200).send({
      err: '读取用户数据错误，请稍后重试!'
    });
  }
};

/**
 * 重置用户密码
 * @param req
 * @param res
 */
exports.resetPassword = function (req, res) {
  var id = req.body.userId;
  console.log(req.body);
  if(id) {
    User.findOne({
      _id: id
    }, function (err, user) {
      var pwd = user.encryptPassword('123456');
      var updata = {
        hashed_password: pwd
      };
      var options = {};
      User.update({
        _id: id
      }, updata, options, function (err, ff) {
        req.flash("success", "密码已重置!");
        if(user.approvedStatus == '01') {
          res.redirect('/user/waitList')
        } else {
          res.redirect('/user/list')
        }
      });
    });
  } else {
    req.flash("error", "没有找到用户");
    res.redirect('/user/list');
  }
};
/**
 * 验证用户密码
 * @param req
 * @param res
 */
exports.validatePwd = function (req, res) {
  var id = req.user._id;
  var pwd = req.params.oldPwd || req.query.oldPwd;
  User.findById(id, function (err, user) {
    if(!user || !user.authenticate(pwd)) {
      console.log("输入的原密码不正确");
      res.send('false');
    } else {
      console.log("输入的原密码正确");
      res.send('true');
    }
  });
};