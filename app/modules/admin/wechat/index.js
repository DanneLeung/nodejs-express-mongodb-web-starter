/**
 * Created by danne on 2016/3/11.
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var wechatCtrl = require('./wechat.controller');

var multer = require('multer');
var upload = multer({
  'dest': config.file.local + '/upload/tmp/'
});

router.use(Auth.requiresLogin);
////微信管理上下文环境，wechat和wechatList已经放到res.locals里面
router.use(Auth.requiresLogin, function (req, res, next) {
  res.locals.wechatTypes = {
    '1': '普通订阅号',
    '2': '认证订阅号',
    '3': '普通服务号',
    '4': '认证服务号'
  };
  next();
});
router
  .get("/", wechatCtrl.index)
  .all("/datatable", wechatCtrl.datatable)
  .get("/add", wechatCtrl.add)
  .get("/edit/:id", wechatCtrl.edit)
  .all("/del", wechatCtrl.del)
  .post("/save", upload.any(), wechatCtrl.save);

module.exports = router;