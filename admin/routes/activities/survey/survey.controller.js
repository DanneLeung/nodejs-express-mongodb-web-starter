/**
 * Created by danne on 2016-04-28.
 */
/**
 * 通用表单
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');

//var Event = require('./event.model');
//var EventApply = require('./event.apply.model');

/**
 * 线下活动列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  //Event.find({channel: req.session.channelId}, function (err, events) {
  //  if (err) {
  //    req.flash("error", err);
  //  }
  //  res.render('activities/event/list', {events: events ? events : []});
  //});
};