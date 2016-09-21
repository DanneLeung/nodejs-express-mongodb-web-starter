/**
 * Created by yu869 on 2016/3/14.
 */
"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var Auth = require(config.root + '/middleware/authorization');

// 系统管理下均需要授权
router.all("/*", Auth.requiresLogin);

var SettingController = require('../controllers/SettingController');

router.get("/paymentSetting", SettingController.paymentSetting)
    .all("/payment/dataTable", SettingController.paymentDataTable)
    .get("/payment/add", SettingController.paymentAdd)
    .get("/payment/paymentEdit", SettingController.paymentEdit)
    .post("/payment/save", SettingController.paymentSave)
    .post("/payment/enableOrDisable", SettingController.enableOrDisable)
    .post("/payment/del", SettingController.paymentDel);

router.get("/smsSetting", SettingController.smsSetting)
    .all("/sms/dataTable", SettingController.smsDataTable)
    .get("/sms/add", SettingController.smsAdd)
    .post("/sms/save", SettingController.smsSave)
    .post("/sms/del", SettingController.smsDel)
    .get("/sms/smsEdit/:id", SettingController.smsEdit)
    .get("/sms/enabled/:id", SettingController.isEnabled)
    .post("/sms/smsEnableOrDisable", SettingController.smsEnableOrDisable);

module.exports = router;