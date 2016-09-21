/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../config/config');

var multer = require('multer');
var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });

var ctrl = require('./page.controller');

router
  .get(['/page/', '/page/:type', '/page/index', '/page/index/:type'], ctrl.index)
  .get('/page/add', ctrl.add)
  .get('/page/edit/:id', ctrl.edit)
  .post('/page/save', ctrl.save);


module.exports = router;
