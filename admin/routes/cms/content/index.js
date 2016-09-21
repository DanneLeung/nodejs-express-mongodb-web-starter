/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../config/config');

var multer = require('multer');
var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });

var ctrl = require('./content.controller');

router
  .get(['', '/list'], ctrl.index)
  .get('/datatable', ctrl.datatable)
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .post('/save', ctrl.save);


module.exports = router;
