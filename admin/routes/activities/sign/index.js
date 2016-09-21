/**
 * 线下报名活动管理
 */

"use strict";

var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../../../../config/config');
var ctrl = require('./sign.controller');

var upload = multer({'dest': config.file.local + '/upload/tmp/'});
router
  .get(['/', '/index'], ctrl.index)
  .get('/datatable', ctrl.datatable)
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .get('/enable/:id', ctrl.enable)
  .get('/checkName', ctrl.checkName)
  .all('/del/:ids', ctrl.del)
  .post('/save', upload.any(), ctrl.save)

  //统计和查询的路由
  .get('/stat/:id', ctrl.statList)
  .get('/getDataByDay/:id', ctrl.getDataByDay)
  .get('/getDataByWeek/:id', ctrl.getDataByWeek)
  .get('/getDataByMonth/:id', ctrl.getDataByMonth)
  .get('/list/datatable/:id', ctrl.listDatatable)

;
module.exports = router;
