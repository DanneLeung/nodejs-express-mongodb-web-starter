/**
 * Created by danne on 2016-04-28.
 */
/**
 * 商城管理
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');

//var Event = require('./event.model');
//var EventApply = require('./event.apply.model');
//var Shop = mongoose.model('Shop');
//
/**
 * 商城首页
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  //Event.find({channel: req.session.channelId}, function (err, events) {
  //  if (err) {
  //    req.flash("error", err);
  //  }
  res.render('shop/index');
  //});
};
/**
 * 商城首页
 * @param req
 * @param res
 */
exports.base = function (req, res) {
  //Shop.findOne({channel: req.session.channelId}, function (err, shop) {
  //  if (err) {
  //    req.flash("error", err);
  //  }
  //  res.render('shop/index', {shop: shop});
  //});
  res.render('shop/index');
};