'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../../../config/config');
var captcha = require(config.root + '/helper/captcha');

var Auth = require(config.root + '/middleware/authorization');
var ctrl = require('./index.controller');
var router = express.Router();

router
  .get('/login', ctrl.login) //登录页面
  .post('/login',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: true
    }), ctrl.session) //登录form提交
  .get('/logout', ctrl.logout)
  .get(['/captcha', '/captcha/:type'], captcha.getCaptcha)
  .get('/profile/:username', Auth.requiresLogin, ctrl.profile) //用户资料
  .post('/profile/update/:username', ctrl.updateProfile) //保持更新用户资料
  .post('/changePwd', Auth.requiresLogin, ctrl.editPassword) //修改用户密码
  .get('/validatePwd', Auth.requiresLogin, ctrl.validatePwd) //验证密码是否正确
  .get(['/', '/index'], ctrl.index);
module.exports = router;