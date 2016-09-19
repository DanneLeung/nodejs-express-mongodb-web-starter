/**
 * Created by yu869 on 2016/3/15.
 */

"use strict";
var express = require('express');
var router = express.Router();
var ctrl = require('./register.controller');

router.use(function (req, res, next) {
  res.locals.theme = res.locals.themeRoot + "/jquery-weui";
  return next();
});

// 渠道普通用户
router
  .get(['/apply', '/register'], ctrl.apply)
;


module.exports = router;
