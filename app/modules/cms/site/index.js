/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./site.controller');

router
  .get(['', '/list'], ctrl.index)
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .get('/enable/:id', ctrl.enable)
  .all('/del/:ids', ctrl.del)
  .post('/save', ctrl.save)
  .get('/copy/:id', ctrl.copy)   //复制

  .get('/template/:id', ctrl.template)  //模板
  //.get('/enable/:id', ctrl.enable)  //激活
  .post('/template/save/:id', ctrl.templateSave)  //模板保存

  .get('/navigate/:id', ctrl.navigate)    //导航
  .post('/navigate/save/:id', ctrl.navigateSave)    //导航
;


module.exports = router;
