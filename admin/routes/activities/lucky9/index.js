/**
 * 幸运九宫格游戏
 */
"use strict";
var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../../../../config/config');
var ctrl = require('./lucky9.controller');

var upload = multer({'dest': config.file.local + '/upload/tmp/'});
router
  .get(['/', '/index'], ctrl.index)
  .get('/datatable', ctrl.datatable)
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .get('/online/:id', ctrl.online)
  .get('/enable/:id', ctrl.enable)
  .get('/checkName', ctrl.checkName)
  .all('/del/:ids', ctrl.del)
  .post('/save', upload.any(), ctrl.save)

;
module.exports = router;
