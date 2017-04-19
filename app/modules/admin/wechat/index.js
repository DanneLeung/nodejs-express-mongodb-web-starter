/**
 * Created by danne on 2016/3/11.
 */

"use strict";

var express = require('express');
var mongoose = require('mongoose');

var router = express.Router();

var config = require('../../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var Wechat = mongoose.model('Wechat');

var wechatCtrl = require('./wechat.controller');
var fansCtrl = require('./wechat.fans.controller');

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

router.use((req, res, next) => {
  Wechat.find({}, function (err, wechats) {
    if(err) console.error(err);
    res.locals.wechats = wechats;
    return next();
  });
});

router
  .get(["/fans", "/fans/:wechatId"], fansCtrl.list)
  .all("/fans/block/:id", fansCtrl.block)
  .all("/fans/datatable/:wechatId", fansCtrl.datatable)
  .post("/fans/syncWechatFans/:wechatId", fansCtrl.syncWechatFans)
  .post("/fans/setRemark", fansCtrl.setRemark)
  .post("/fans/addGroup", fansCtrl.addGroup)
  .get("/fans/syncGroup", fansCtrl.syncGroup)
  .get(["/fans/getAllGroup", "/fans/getAllGroup/:wechatId"], fansCtrl.getAllGroup)
  .get("/fans/delGroup/:groupId", fansCtrl.del)
  .post("/fans/update", fansCtrl.update)
  .post("/fans/moveUserToGroup", fansCtrl.moveUserToGroup)
  .post("/fans/checkGroup", fansCtrl.checkGroup)

module.exports = router;