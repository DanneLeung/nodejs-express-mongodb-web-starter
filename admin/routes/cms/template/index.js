/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./template.controller');

var multer = require('multer');
var config = require('../../../../config/config');

var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });


router
  .get(['/', '/:type', '/index', '/index/:type'], ctrl.index)
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .post('/save', ctrl.save);


module.exports = router;
