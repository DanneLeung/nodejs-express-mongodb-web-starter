'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../../../config/config');
var captcha = require(config.root + '/helper/captcha');

var ctrl = require('./index.controller');
var router = express.Router();
router.use(function (req, res, next) {
  res.locals.theme = "/themes/lte";
  res.locals.themeRoot = "/themes";
  var url = req.contextRoot + req.baseUrl;
  if (url.indexOf('http') < 0) {
    url = url.replace('//', '/');
  }
  req.absBaseUrl = url;
  return next();
});
router
  .get('/login', ctrl.login) //登录页面
  .post('/login',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: true
    }), ctrl.session) //登录form提交
  .get('/logout', ctrl.logout)
  .get(['/captcha', '/captcha/:type'], captcha.getCaptcha);
//logout
router.all(['/', '/index'], ctrl.index);
module.exports = router;
