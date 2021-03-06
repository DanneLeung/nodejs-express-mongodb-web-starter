/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./category.controller');

var multer = require('multer');
var config = require('../../../../../config/config');

var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });

router
  .get(['', '/list'], ctrl.index)
  .get('/datatable', ctrl.datatable)
  .get(['/add', '/add/:id'], ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .get('/enable/:id', ctrl.enable)
  .post('/del', ctrl.del)
  .post('/save', ctrl.save);

module.exports = router;