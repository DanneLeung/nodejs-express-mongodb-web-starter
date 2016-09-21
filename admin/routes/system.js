"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var Auth = require(config.root + '/middleware/authorization');

//用户控制器
var userController = require('../controllers/UserController');
var roleController = require('../controllers/RoleController');
var permissionController = require('../controllers/PermissionController');
var systemController = require('../controllers/SystemController');
var menuController = require('../controllers/MenuController');
var messageController = require('../controllers/MessageController');
var moduleController = require('../controllers/ModuleController');
var jobController = require('../controllers/JobController');

// 系统管理下均需要授权
router.all("/*", Auth.requiresLogin);

//使用express4,var Router = express.Router().相当于一个简单的app,在Router上面装备控制器与中间件1
router.get(['/user', '/user/list'], userController.list)
  .all("/user/datatable", userController.datatable)
  .get("/user/checkname", userController.checkName)
  // .get('/user/virtualPwd', userController.virtualPwd)//验证密码是否正确
  .post('/user/editPassword', userController.editPassword)//修改用户密码
  .post('/user/resetPassword', userController.resetPassword)//重置用户密码
  .get("/user/add", userController.add)
  .get("/user/edit", userController.edit)
  .get("/user/enabled/:id", userController.isEnabled)
  .get("/user/getRoleSelect", userController.getRoleSelect)
  .all("/user/del", userController.del)
  .post("/user/save", userController.save);

// role
router.get(['/role', '/role/list'], roleController.list)
  .all("/role/datatable", roleController.datatable)
  .get("/role/permission/datatable/:roleId", roleController.datatablePermission)
  .get("/role/checkname", roleController.checkName)
  .get("/role/add", roleController.add)
  .get("/role/edit", roleController.edit)
  .all("/role/del", roleController.del)
  .post("/role/save", roleController.save)
  .get("/role/permissions/:roleId", roleController.permissions)
  .post("/role/addpermissions/:roleId", roleController.addPermissions)
  .post("/role/revokepermissions/:roleId", roleController.revokePermissions)
;

// permission
router.get(['/permission', '/permission/list'], permissionController.list)
  .all("/permission/datatable", permissionController.datatable)
  .get("/permission/checkname", permissionController.checkName)
  .get("/permission/add", permissionController.add)
  .get("/permission/edit", permissionController.edit)
  .all("/permission/del", permissionController.del)
  .post("/permission/save", permissionController.save);

router.get('/setting', systemController.list)
  .all("/setting/dataTable", systemController.dataTable)
  .get('/setting/add', systemController.add)
  .get('/setting/checkName', systemController.checkName)
  .post('/setting/save', systemController.save)
  .get('/setting/edit/:id', systemController.edit)
  .post('/setting/del', systemController.del)
  // .post('/upload', systemController.upload)
  .get('/init', systemController.init);

router.get(['/menu', '/menu/list'], menuController.list)
  .all("/menu/datatable", menuController.datatable)
  .get("/menu/checkname", menuController.checkName)
  .get("/menu/add", menuController.add)
  .get("/menu/getChildren", menuController.getChildren)
  .get("/menu/edit/:id", menuController.edit)
  .get("/menu/isEnable/:id", menuController.enable)
  .get("/menu/topNav/:id", menuController.topNav)
  .get("/menu/getMenu", menuController.getMenus)
  .all("/menu/del", menuController.del)
  .post("/menu/saveSort", menuController.saveSort)
  .post("/menu/save", menuController.save);

router.get('/message', messageController.list)
  .all("/message/datatable", messageController.datatable)
  .get('/message/add', messageController.add)
  .get('/message/checkName', messageController.checkName)
  .post('/message/save', messageController.save)
  .get('/message/edit/:id', messageController.edit)
  .post('/message/del', messageController.del)
;

router.get(['/module', '/module/list'], moduleController.list)
  .all("/module/datatable", moduleController.datatable)
  .get("/module/checkname", moduleController.checkName)
  .get("/module/add", moduleController.add)
  .get("/module/edit/:id", moduleController.edit)
  .get("/module/editable/:id", moduleController.editable)
  .get("/module/enabled/:id", moduleController.isEnabled)
  .get("/module/getModules", moduleController.getModules)
  .post("/module/del", moduleController.del)
  .post("/module/save", moduleController.save);

router.get(['/job', '/job/list'], jobController.list)
  .all("/job/datatable", jobController.datatable)
  .get("/job/checkname", jobController.checkName)
  .get("/job/add", jobController.add)
  .get("/job/edit/:id", jobController.edit)
  .get("/job/enabled/:id", jobController.enabled)
  .get("/job/control/:command/:id", jobController.control)
  .post("/job/del", jobController.del)
  .post("/job/save", jobController.save);

module.exports = router;
