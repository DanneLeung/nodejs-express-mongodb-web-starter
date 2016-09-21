"use strict";

var mongoose = require('mongoose');
var async = require('async');
var config = require('../../config/config');

/**
 * home page
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  // res.redirect('/dashboard');
  res.render('index', {});
};
exports.dashboard = function (req, res) {
  // res.redirect('/dashboard');
  res.render('index', {});
};