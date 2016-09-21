/**
 * Created by yu869 on 2016/1/11.
 * yufan
 */

"use strict";
var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var Auth = require(config.root + '/middleware/authorization');

//发票信息控制器
var branchController = require('./bank/branch/BranchController');
var itemCtrl = require('./bank/branch/ServiceController');
var bookingCtrl = require('./bank/branch/BookingRecordController');
var messageCtrl = require('./bank/branch/BranchMessageController');

//产品贷款
var ctrl = require('./bank/loan/loan.controller');
var typeCtrl = require('./bank/loan/loan.type.controller');
var settCtrl = require('./bank/loan/loan.setting.controller');
var appl = require('./bank/loan/loan.application.controller');

var multer = require('multer');
var upload = multer({'dest': config.file.local + '/upload/tmp/'});
// 系统管理下均需要授权
router.use(Auth.requiresLogin);

//网点管理的控制
router.get(["/branch", "/branch/list"], branchController.list)
  .all("/branch/datatable", branchController.datatable)
  .post("/branch/save", branchController.save)
  .post("/branch/del", branchController.del)
  .get("/branch/edit/:id", branchController.edit)
  .get("/branch/add", branchController.add)
  .get("/branch/checkNo", branchController.checkNo)
  .get("/branch/province", branchController.province)
  .get("/branch/city", branchController.city)
  .get("/branch/district", branchController.district)
  .get("/branch/isEnable/:id", branchController.enable)
  .get("/branch/getData", branchController.getData)

;
//网点服务项的设置
router.get(['/service/list', '/service/index'], itemCtrl.list)
  .get('/service/add', itemCtrl.add)
  .get('/service/edit', itemCtrl.edit)
  .get('/service/checkname', itemCtrl.checkName)
  .post('/service/del', itemCtrl.del)
  .all("/service/datatable", itemCtrl.datatable)
  .post("/service/save", upload.any(), itemCtrl.save)
;
//网点服务预约的控制
router.get(['/booking/list', '/booking/index'], bookingCtrl.list)
  .get('/booking/checkname', bookingCtrl.checkName)
  .post('/booking/del', bookingCtrl.del)
  .all("/booking/datatable", bookingCtrl.datatable)
  .all("/booking/export", bookingCtrl.export)
  .post("/booking/feedback", bookingCtrl.feedback)
  .get("/booking/init", bookingCtrl.init)
;
//网点中留言或评价的控制
router.get(['/message/list', '/message/index'], messageCtrl.list)
  .get('/message/checkname', messageCtrl.checkName)
  .post('/message/del', messageCtrl.del)
  .all("/message/datatable", messageCtrl.datatable)
  .all("/message/export", messageCtrl.export)
  .post("/message/feedback", messageCtrl.feedback)
  .get("/message/init", messageCtrl.init)
  .get("/message/edit/:id", messageCtrl.edit)
;


//产品贷款
router
  //类型
  .get('/loan/type/datatable', typeCtrl.datatable)
  .get(['/loan/type', '/loan/type/index'], typeCtrl.index)
  .post('/loan/type/save', upload.any(), typeCtrl.save)
  .get('/loan/addloadtype', typeCtrl.add)
  .get('/loan/type/edit/:id', typeCtrl.edit)
  .post('/loan/type/parent', typeCtrl.parent)
  .get('/loan/type/checkName', typeCtrl.checkName)
  .get('/loan/type/del/:id', typeCtrl.del)
  .get('/loan/type/enabled/:id', typeCtrl.enabled)

  //产品
  .get('/loan/datatable', ctrl.datatable)
  .get('/loan/list', ctrl.list)
  .get('/loan/addloan', ctrl.add)
  .get('/loan/edit/:id', ctrl.edit)
  .post('/loan/gettype', ctrl.getType)
  .get('/loan/checkName', ctrl.checkName)
  .post('/loan/save', upload.any(), ctrl.save)
  .get('/loan/del/:id', ctrl.del)
  .get('/loan/enabled/:id', ctrl.enabled)

  //页面设置
  .get('/loan/setting', settCtrl.index)
  .get('/loan/getSlide', settCtrl.getSlide)
  .post('/loan/setting/save',upload.any(), settCtrl.save)

  //申请
  .get('/loan/appl', appl.list)
  .get('/loan/appl/datatable', appl.datatable)
  .post('/loan/exportCsv', appl.exportCsv)

;
module.exports = router;
