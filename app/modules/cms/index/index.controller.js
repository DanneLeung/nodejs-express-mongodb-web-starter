/**
 * Created by danne on 2016-04-28.
 */
var mongoose = require('mongoose');

var async = require('async');
var moment = require('moment');

//
/**
 * CMS首页
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('cms/index');
};