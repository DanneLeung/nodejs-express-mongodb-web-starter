/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();

var ctrl = require('./page.controller');

router
  .get(['/', '/:site', '/index', '/index/:type'], ctrl.index)
  .get('/datatable/:site', ctrl.datatable)
  .get('/add/:site', ctrl.add)
  .get('/edit/:id/:site', ctrl.edit)
  .all('/del/:site', ctrl.del)
  .post('/save', ctrl.save);


module.exports = router;
