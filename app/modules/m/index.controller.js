'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.index = function (req, res) {
  res.render('m/index');
};

exports.home = function (req, res) {
  res.render('m/home');
};

exports.user = function (req, res) {
  res.render('m/user');
};