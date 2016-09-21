/**
 * Created by danne on 2016/3/11.
 * 站点管理
 */
"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var passport = require('passport');
var Auth = require(config.root + '/middleware/authorization');
var fs = require('fs');

var mongoose = require('mongoose');
var async = require('async');

var Site = mongoose.model('Site');
var Wechat = mongoose.model('ChannelWechat');

router.use(Auth.requiresLogin);

router.use('/', function (req, res, next) {
  var channelId = req.session.channelId;
  var s = function (callback) {
    Site.find({
      channel: channelId
    }, function (err, sites) {
      callback(err, sites);
    })
  };
  var c = function (callback) {
    Wechat.find({
      channel: channelId
    }, function (err, wechats) {
      callback(err, wechats);
    })
  };
  async.parallel({
    sites: s,
    wechats: c
  }, function (err, result) {
    res.locals.sites = result.sites ? result.sites : [];
    res.locals.wechats = result.wechats ? result.wechats : [];
    next();
  });
});

// Routers
router.use(Auth.requiresLogin);
// load activities modules
var modulePath = __dirname + '/' + 'cms';
fs.readdirSync(modulePath).forEach(function (file) {
  if (file.indexOf('.') < 0) {
    var module = "./cms/" + file;
    var p = "/";
    if (!('index' == file || 'home' == file)) {
      p = p + file;
    }
    console.log("**** routes " + p + " to " + module);
    // module routes
    router.use(p, require(module));
    // module static contents
    router.use(p, express.static(__dirname + '/' + module + '/static'));
  }
});


module.exports = router;
