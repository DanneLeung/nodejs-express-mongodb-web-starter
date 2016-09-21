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
var mongoose = require('mongoose');
var async = require('async');

var Site = mongoose.model('Site');
var Wechat = mongoose.model('ChannelWechat');

var siteCtrl = require('../controllers/SiteController');
var templateCtrl = require('../controllers/TemplateController');
var pageCtrl = require('../controllers/PageController');
var articleCtrl = require('../controllers/ArticleController');

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

router
//重定向到列表页
  .get(['/'], function (req, res) {
    res.redirect('/site/list')
  })
  .get(['/list'], siteCtrl.index)
  .get('/add', siteCtrl.add)
  .get('/edit/:id', siteCtrl.edit)
  .all('/del/:ids', siteCtrl.del)
  .post('/save', siteCtrl.save);

router
  .get(['/template/', '/template/:type', '/template/index', '/template/index/:type'], templateCtrl.index)
  .get('/template/add', templateCtrl.add)
  .get('/template/edit/:id', templateCtrl.edit)
  .post('/template/save', templateCtrl.save);

router
  .get(['/page/', '/page/:type', '/page/index', '/page/index/:type'], pageCtrl.index)
  .get('/page/add', pageCtrl.add)
  .get('/page/edit/:id', pageCtrl.edit)
  .post('/page/save', pageCtrl.save);

router
  .get('/article/datatable', articleCtrl.datatable)
  .get(['/article'], articleCtrl.index)
  .get('/article/add', articleCtrl.add)
  .get('/article/edit/:id', articleCtrl.edit)
  .post('/article/save', articleCtrl.save);

module.exports = router;
