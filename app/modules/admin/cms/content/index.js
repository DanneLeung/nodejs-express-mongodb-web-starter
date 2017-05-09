/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../../config/config');
var multer = require('multer');
var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });

var ctrl = require('./content.controller');

router
  .get(['', '/list'], ctrl.index)
  .get('/trash/list', ctrl.trash)
  .get('/datatable', ctrl.datatable)
  .get('/trash/datatable', ctrl.trashDatatable)
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .get('/publish/:id', ctrl.publish)
  .post('/del', ctrl.del)
  .post('/save', upload.any(), ctrl.save);


module.exports = router;
