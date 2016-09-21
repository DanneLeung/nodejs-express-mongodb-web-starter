"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var passport = require('passport');

var Auth = require(config.root + '/middleware/authorization');
var captcha = require('../../helper/captcha');
var homeCtrl = require('../controllers/HomeController');
var userCtrl = require('../controllers/UserController');


router
  .get('/login', userCtrl.login) //登录页面
  .post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }), userCtrl.session) //登录form提交
  .get('/logout', userCtrl.logout) //logout
  // .get('/checkunique/:prop', userCtrl.checkUnique)
  .get('/register', userCtrl.register)
  .get(['/captcha', '/captcha/:type'], captcha.getCaptcha)
  .get('/dashboard', Auth.requiresLogin, homeCtrl.dashboard)
  // .get('/forgetPass', userCtrl.forgetPass)
  // .post('/checkForgetPass', userCtrl.checkForgetPass)
  //.post('/verification', homeCtrl.verification)
  // .post('/:uername/update', homeCtrl.updateProfile) //保持更新用户资料
  // .post('/editPassword', homeCtrl.editPassword) //修改用户密码
  // .get('/virtualPwd', homeCtrl.virtualPwd) //验证密码是否正确

  .get('/profile/:username', Auth.requiresLogin, userCtrl.profile)
  .get(['/', '/index'], Auth.requiresLogin, homeCtrl.index) //首页
  ;
module.exports = router;
