/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./unit.class.controller');
var multer = require('multer');
var config = require('../../../../config/config');

var upload = multer({'dest': config.file.local + '/upload/tmp/'});

router.get(['/', '/index'], function (req, res) {
    res.redirect('/shop/unit/list')
  })
  .get(["/list"], ctrl.list)
  .all("/datatable", ctrl.datatable)
  .get("/add", ctrl.add)
  .post("/save", ctrl.save)
  .get("/del/:ids", ctrl.del)
  .get("/edit/:id", ctrl.edit)
  .get("/checkTitle", ctrl.checkTitle)
  .get("/getUnits", ctrl.getUnits)

;

module.exports = router;
