/**
 * Created by danne on 2016/3/11.
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var systemCtrl = require('./system.controller');

var settingCtrl = require('./setting.controller');
var userCtrl = require('./user.controller');
var groupCtrl = require('./user.group.controller');
var multer = require('multer');
var upload = multer({
  'dest': config.file.local + '/upload/tmp/'
});

router.use(Auth.requiresLogin);

router.get('/', systemCtrl.index);

router.get("/user", userCtrl.list)
  .all("/user/datatable", userCtrl.datatable)
  .get("/user/add", userCtrl.add)
  .post("/user/del", userCtrl.del)
  .get("/user/edit/:id", userCtrl.edit)
  .get("/user/checkName", userCtrl.checkName)
  .get("/user/checkNo", userCtrl.checkNo)
  .get("/user/isEnable/:id", userCtrl.enable)
  .post("/user/save", userCtrl.save) //保存
  .post("/user/editPassWord", userCtrl.editPassWord)
  .get("/user/reset/:id", userCtrl.resetUserPwd)
  .all(["/user/changepwd/:id", "/user/changepwd"], userCtrl.changepwd)
  .get("/user/autoGeneration", userCtrl.autoGenerations)
  .get("/user/approved/:id", userCtrl.approved) //跳转
  .post("/user/importUser", upload.any(), userCtrl.importUser)
  .post("/user/setGroup", userCtrl.setGroup)
  .post("/user/resetPwd", userCtrl.resetPwd)
  .get("/user/exportUser", userCtrl.exportUser)
  .get("/user/export", userCtrl.export);

router.use(Auth.requiresLogin);
router
  //基础设置
  .get('/base', systemCtrl.base)
  .post('/base/save', upload.any(), systemCtrl.baseSave);

router.get(["/group", "/group/list"], groupCtrl.list)
  .all("/group/datatable", groupCtrl.datatable)
  .post("/group/save", groupCtrl.save)
  .get("/group/checkName", groupCtrl.checkName)
  .post("/group/del", groupCtrl.del)
  .get("/group/edit/:id", groupCtrl.edit)
  .get("/group/add", groupCtrl.add)
  .get("/group/getGroups", groupCtrl.getGroups)
  .get("/group/isEnable/:id", groupCtrl.enable)
  //渠道授权
  .get("/group/grant/:id", groupCtrl.menu);

router.get('/setting', settingCtrl.list)
  .all("/setting/datatable", settingCtrl.dataTable)
  .get('/setting/add', settingCtrl.add)
  .get('/setting/checkName', settingCtrl.checkName)
  .post('/setting/save', settingCtrl.save)
  .get('/setting/edit/:id', settingCtrl.edit)
  .post('/setting/del', settingCtrl.del);
module.exports = router;