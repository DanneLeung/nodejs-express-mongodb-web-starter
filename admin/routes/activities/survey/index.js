/**
 * 通用表单模块
 */

"use strict";

var express = require('express');
var router = express.Router();

var ctrl = require('./survey.controller');
router
  .get(['/', '/index'], ctrl.index)
;
module.exports = router;
