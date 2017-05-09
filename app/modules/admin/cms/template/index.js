/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./template.controller');
var multer = require('multer');
var config = require('../../../../../config/config');

var upload = multer({'dest': config.file.local + '/upload/tmp/'});

router
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .get('/enable/:id', ctrl.enable)
  .get('/del/:id', ctrl.del)
  .post('/save', upload.any(), ctrl.save)
  .get(['/', '/:type', '/index', '/index/:type'], ctrl.index)
;

module.exports = router;
