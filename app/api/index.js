'use strict';

var express = require('express');

var wechatCtrl = require('./api.wechat.controller');
var router = express.Router();
//集中获取access token api
router.get("/getAccessToken", wechatCtrl.getAccessToken);
router.get("/getAuthAccessToken", wechatCtrl.getAuthAccessToken);

router.all(["/getUser", "/getUser/:openid"], wechatCtrl.getUser);
router.all(["/getUserByUnionId", "/getUserByUnionId/:unionid"], wechatCtrl.getUserByUnionId);
router.post("/getAppid", wechatCtrl.getAppId);
router.post("/getUserinfo", wechatCtrl.getUserinfo);
router.all("/jsConfig", wechatCtrl.jsConfig);
router.all("/save/menuShareTimeline", wechatCtrl.saveMenuShareTimeline);

var uploadCtrl = require('./api.wechat.upload.controller');
router.all("/uploadImage", uploadCtrl.uploadImages);

module.exports = router;