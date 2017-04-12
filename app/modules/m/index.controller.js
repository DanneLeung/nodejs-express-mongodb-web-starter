'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.index = function (req, res) {
  res.render('index');
};