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
var servicesTypeController = require('../controllers/ServicesTypeController');
var serviceController = require('../controllers/ServiceController');
var contactController = require('../controllers/ContactController');

// 系统管理下均需要授权
router.all("/*", Auth.requiresLogin);

//使用express4,var Router = express.Router().相当于一个简单的app,在Router上面装备控制器与中间件1
router.get(['/servicesType', '/servicesType/list'], servicesTypeController.list)
    .all("/servicesType/datatable", servicesTypeController.datatable)
    .get("/servicesType/checkname", servicesTypeController.checkName)
    .get("/servicesType/add", servicesTypeController.add)
    .get("/servicesType/edit", servicesTypeController.edit)
    .get("/servicesType/getServiceType", servicesTypeController.getServiceType)
    .all("/servicesType/del", servicesTypeController.del)
    .post("/servicesType/save", servicesTypeController.save)

    //服务供应商访问接口
    .get(['/service', '/service/list'], serviceController.list)
    .all("/service/datatable", serviceController.datatable)
    .get("/service/checkname", serviceController.checkName)
    .get("/service/add", serviceController.add)
    .get("/service/edit", serviceController.edit)
    .get("/service/isEnable", serviceController.enable)
    .get("/service/getService", serviceController.getService)
    .all("/service/del", serviceController.del)
    .post("/service/save", serviceController.save)

    .get(['/contact/:servicesId', '/contact/list'], contactController.list)
    .all("/contact/datatable/:servicesId", contactController.datatable)
    .get("/contact/checkname", contactController.checkName)
    .get("/contact/add/:servicesId", contactController.add)
    .get("/contact/edit/:servicesId", contactController.edit)
    .all("/contact/del", contactController.del)
    .post("/contact/save", contactController.save)

;

module.exports = router;
