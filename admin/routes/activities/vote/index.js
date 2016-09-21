/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();

var ctrl = require('./vote.controller');
router
  .get(['/', '/index'], ctrl.index)
;
module.exports = router;
