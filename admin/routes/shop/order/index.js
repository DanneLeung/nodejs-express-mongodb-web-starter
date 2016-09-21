/**
 * Created by yu869 on 2016/1/11.
 * yufan
 */

"use strict";
var express = require('express');
var router = express.Router();

//控制器
var ctrl = require('./charge.order.controller.js');
var orderCtrl = require('./order.controller.js');

// 系统管理下均需要授权SS
//router.all("/*", Auth.requiresLogin);

//使用express4,var Router = express.Router().相当于一个简单的app,在Router上面装备控制器与中间件1

//渠道管理员的设置
router
  .get(["/charge", "/list"], ctrl.list)
  .all("/charge/datatable", ctrl.datatable)
  .get("/charge/checkname", ctrl.checkName)

  .get(["/", "/index"], orderCtrl.list)
  .post("/publish", orderCtrl.publish)
  .post("/del", orderCtrl.del)
  .get("/inits", orderCtrl.inits)
  .get("/export", orderCtrl.export)
  .get("/view/:id", orderCtrl.views)
  .all("/datatable", orderCtrl.datatable)


;
module.exports = router;
