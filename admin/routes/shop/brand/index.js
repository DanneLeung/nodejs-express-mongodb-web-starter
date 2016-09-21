/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./brand.controller');

var multer = require('multer');
var config = require('../../../../config/config');

var upload = multer({'dest': config.file.local + '/upload/tmp/'});


router.get(['/', ''], ctrl.index)
  .get('/datatable', ctrl.datatable)
  .post("/save",upload.any(), ctrl.save)
  .get("/del/:id", ctrl.del)
  .get("/edit/:id", ctrl.edit)
  .get("/add", ctrl.add)
  .get("/enable/:id", ctrl.enable)
  .get("/checkName", ctrl.checkName)
;
module.exports = router;
