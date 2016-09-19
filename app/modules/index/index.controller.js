'use strict';

var _ = require('lodash');
var pass
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
var async = require('async');


// login to system.
/**
 * login session
 * @type {login}
 */
exports.session = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  req.flash('success', '欢迎登录系统！');
  res.redirect(redirectTo);
};

/**
 * login page
 * @param req
 * @param res
 */
exports.login = function (req, res) {
  res.render(__dirname + '/views/login');
};

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.session.channelId = null;
  delete req.session.channel;
  delete req.session.user;
  req.logout();
  res.redirect('/')
};


/**
 * vendor registration page
 * @param req
 * @param res
 */
exports.register = function (req, res) {
  res.render('register', {
    user: new Channel({
      username: '',
      email: '',
      mobile: ''
    })
  });
};


exports.index = function (req, res) {
  res.render(__dirname + '/views/index')
};
