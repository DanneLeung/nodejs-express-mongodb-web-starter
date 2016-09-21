/**
 * 答题闯关活动rest api
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');

var Quiz = require('./quiz.model');

function handleError(res, err) {
  return res.status(500).json(err);
}

/**
 *
 */
exports.index = function(req, res) {
  res.status(200).json({});
};
