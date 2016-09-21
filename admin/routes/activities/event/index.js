/**
 * 线下报名活动管理
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../config/config');
var multer = require('multer');

var ctrl = require('./event.controller');
var usersCtrl = require('./event.user.controller.js');
var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });
router
  .get(['/', '/index'], ctrl.index)
  .all("/datatable", ctrl.datatable)
  .get('/add', ctrl.add)
  .post('/save', upload.any(), ctrl.save)
  .get('/edit/:id', ctrl.edit)
  .get('/copy/:id', ctrl.copy)
  .get('/enable/:id', ctrl.enable)
  .all('/del/:ids', ctrl.del);

router
  .get(['/users/:eventId'], usersCtrl.index)
  .all('/users/datatable/:eventId', usersCtrl.datatable)
  .get('/sign/:eventId', usersCtrl.sign) //用户报名页面
  .post('/exportCsv/:eventId', usersCtrl.exportCsv) //用户报名提交
  .post('/save/:eventId', usersCtrl.save) //用户报名提交
;
module.exports = router;
