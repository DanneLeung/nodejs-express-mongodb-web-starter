/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./index.controller');

router
  //重定向到列表页
  .get(['/', ''], function (req, res) {
    res.redirect('/cms/site')
  })
  ;
module.exports = router;
