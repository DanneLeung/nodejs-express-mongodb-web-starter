/**
 * Created by yu869 on 2016/3/15.
 */

"use strict";
var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var Auth = require(config.root + '/middleware/authorization');
var userController = require('../controllers/UserController');
var channelUserH5Controller = require('../controllers/ChannelUserH5Controller');
router
  .get("/resetPwd", userController.resetPwd)
  .post("/resetBySMS", userController.resetBySMS)
  .post("/resetByEmail", userController.resetByEmail);

router.use(Auth.requiresLogin);

router.post("/register", userController.register)
  .get("/sentValid", userController.sentValid)
  .get("/checkCode", userController.checkCode)
  .get("/checkUsername", userController.checkUsername)
  .post("/checkValid", userController.checkValid)
  .post("/changePwd", userController.changePwd)
;

router.use(function (req, res, next) {
  res.locals.theme = '/q/themes/weui';
  return next();
});
// 渠道普通用户
router.get('/apply', userController.apply);


router.get("/h5/register", channelUserH5Controller.register)
  .post("/h5/save", channelUserH5Controller.save)
  .post("/h5/sendCheckCode", channelUserH5Controller.sendCheckCode)
  // .post("/h5/jsConfig", channelUserH5Controller.jsConfig)
  // .post("/h5/getOpenid", channelUserH5Controller.getOpenIdQuiet)
  .post("/h5/saveUploadImg", channelUserH5Controller.saveUploadImg)
  .post("/h5/sentValid", channelUserH5Controller.sentValid)
  .post("/h5/unionCheck", channelUserH5Controller.unionCheck)
  // .post("/h5/getAppid", channelUserH5Controller.getAppid)
  .post("/h5/unionCheck", channelUserH5Controller.unionCheck)
  .get("/h5/registerViewFind", channelUserH5Controller.registerViewFind)
  .post("/h5/submitApply", channelUserH5Controller.submitApply)
  .post("/h5/submitReApply", channelUserH5Controller.submitReApply)
;
module.exports = router;
