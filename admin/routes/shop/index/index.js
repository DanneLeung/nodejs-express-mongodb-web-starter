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
    res.redirect('/shop/index')
  })
  .get(['/list', '/index'], ctrl.index)
  .get('/base', ctrl.base)
  //.get('/edit/:id', linkCtrl.edit)
  //.all('/del/:ids', linkCtrl.del)
  //.post('/save', linkCtrl.save)
;
module.exports = router;
