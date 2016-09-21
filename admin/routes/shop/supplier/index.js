/**
 * Created by yu869 on 2016/1/11.
 * yufan
 */

"use strict";
var express = require('express');
var router = express.Router();

var multer = require('multer');

var config = require('../../../../config/config');

var upload = multer({
  'dest': config.file.local + '/upload/tmp/'
});

//控制器
var ctrl = require('./supplier.controller');

router
  //供应商的管理控制
  .get(["/", "/list"], ctrl.list)
  .get("/add", ctrl.add)
  .get("/edit/:id", ctrl.edit)
  .post("/save", ctrl.save)
  .post("/del", ctrl.del)
  .all("/datatable", ctrl.dataTable)
  .get("/checkName", ctrl.checkName)
  .get("/isEnable/:id", ctrl.isEnable)

  //供应商分类的控制
  .get("/typeList", ctrl.typeList)
  .get("/type_add", ctrl.type_add)
  .get("/type_edit/:id", ctrl.type_edit)
  .post("/type_save", ctrl.type_save)
  .post("/type_del", ctrl.type_del)
  .all("/type_table", ctrl.type_table)
  .get("/type_check_name", ctrl.type_check_name)

  //供应商联系人的控制
  .get("/contactList/:id", ctrl.contactList)
  .get("/contact_add/:supplier", ctrl.contact_add)
  .get("/contact_edit/:supplier/:id", ctrl.contact_edit)
  .post("/contact_save", ctrl.contact_save)
  .post("/contact_del", ctrl.contact_del)
  .all("/contact_table/:supplier", ctrl.contact_table)
  .get("/checkName/:id", ctrl.checkName)

;


module.exports = router;
