'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var router = express.Router();
var ctrl = require('./index.controller');

router
  .get('/', (req, res) => {
    res.render('admin/index');
  })
  .post('/profile/pwd/change', Auth.requiresLogin, ctrl.changePwd) //修改用户密码
  .get('/profile/pwd/validate', Auth.requiresLogin, ctrl.validatePwd) //验证密码是否正确
  .get('/profile/:username', Auth.requiresLogin, ctrl.profile) //用户资料
  .post('/profile/update/:username', ctrl.updateProfile) //保持更新用户资料
;
module.exports = router;