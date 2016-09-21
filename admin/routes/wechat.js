/**
 * Created by yu869 on 2016/1/11.
 * yufan
 */

"use strict";
var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var wechatController = require('../controllers/WechatController');
var fansController = require('../controllers/WechatFansController');

var qrCodeController = require('../controllers/QrCodeController');
var wechatQrCodeController = require('../controllers/WechatQrCodeController');
var wechatAppController = require('../controllers/WechatAppController');
var wechatDiyReplyController = require('../controllers/WechatDiyNewsReplyController');

var upload = multer({
  'dest': config.file.local + '/upload/tmp/'
});
//使用express4,var Router = express.Router().相当于一个简单的app,在Router上面装备控制器与中间件1

var requireWechat = function (req, res, next) {
  var wechatId = req.params.wechatId || req.query.wechatId || req.body.wechatId;
  // console.log('********** requireWechat ', req.params.wechatId);
  if (!wechatId && !req.session.wechat) {
    res.redirect('/wechat');
  } else {
    next();
    console.log('***************** wechat  ', req.session.wechatId, req.session.wechat.name);
  }
};

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
// router.param("wechatId", wechatController.context);
router
  .get(["/", "/index"], wechatController.list)
  .all("/datatable", wechatController.datatable)
  .get("/add", wechatController.add)
  .get("/edit/:id", wechatController.edit)
  .all("/del", wechatController.del)
  .post("/save", upload.any(), wechatController.save);

//微信公众号管理功能路由，注意路由有先后顺序，越通用的路由放到约后
// wechat app setting.
router.get(['/apps', '/apps/list'], wechatAppController.appList)
  .get('/apps/wechatList', wechatAppController.list)
  .get('/apps/addAppToWechat/:appId', wechatAppController.addAppToWechat)
  .get('/apps/enable/:id', wechatAppController.enable);

//自定义菜单
router
  .get(["/mgmt/clstoken", "/mgmt/clstoken/:id"], requireWechat, wechatController.clearToken)
  .get("/mgmt/menu", requireWechat, wechatController.menu)
  .get("/mgmt/menu/designer", requireWechat, wechatController.designer)
  .post("/mgmt/menu/designer", requireWechat, wechatController.designerSave)
  .get("/mgmt/sendmsg", requireWechat, wechatController.sendmsg)
  .get("/mgmt/getMenu", requireWechat, wechatController.getMenu)
  .post("/mgmt/createMenu", requireWechat, wechatController.createMenu)

//二维码
router.get("/qrcode", requireWechat, qrCodeController.index)
  .get("/qrcode/transfer", requireWechat, qrCodeController.transfer);
//素材管理
router.get("/media", requireWechat, wechatController.media)
  .get("/media/getMedia", requireWechat, wechatController.getMedia)
  .get("/media/syncMedia", requireWechat, wechatController.syncMedia)
  .get("/media/removeMedia", requireWechat, wechatController.removeMedia)
  .get("/media/getMaterial/:mediaId", requireWechat, wechatController.getMaterial)
  .get("/media/saveMedia", requireWechat, wechatController.saveMedia)
  .get("/media/editor", requireWechat, wechatController.mediaEditor);
//自动回复
router
  .get("/mgmt/autoreply", requireWechat, wechatController.autoreply)
  .post("/mgmt/saveOutoReply", requireWechat, wechatController.saveOutoReply);
//自定义回复图文
router
  .get("/mgmt/diy/autoreply", requireWechat, wechatDiyReplyController.list)

//微信推送
router
  .get("/mgmt/datatable", requireWechat, wechatController.datatable)
  //关键字回复
  .post("/mgmt/saveKeyWord", requireWechat, wechatController.saveKeyWord)
  .post("/mgmt/delKyeWord/:id", requireWechat, wechatController.delKyeWord)
  .get("/mgmt/editKyeWord/:id", requireWechat, wechatController.editKyeWord);

router
  .get(["/mgmt/:wechatId"], wechatController.context)
// 在此之后的路由均需要检查当前微信号
router.use(requireWechat);
router
  .get(["/mgmt/"], wechatController.mgmt)
  .post("/mgmt/group/wechatFans", wechatController.groupWechatFans)
  .get("/mgmt/userSource/get", wechatController.userSource)
router
  .get(["/mgmt/group/:wechatId"], wechatController.yesterdayGroup)
  .get(["/mgmt/wechatFansGroup/:wechatId"], wechatController.wechatFansGroup)

//公众号下的粉丝
router
  .get(["/fans/list", "/fans"], fansController.list)
  .all("/fans/datatable", fansController.datatable)
  .post("/fans/syncWechatFans", fansController.syncWechatFans)
  .post("/fans/setRemark", fansController.setRemark)
  .post("/fans/addGroup", fansController.addGroup)
  .get("/fans/syncGroup", fansController.syncGroup)
  .get("/fans/getAllGroup", fansController.getAllGroup)
  .get("/fans/delGroup/:groupId", fansController.del)
  .post("/fans/update", fansController.update)
  .post("/fans/moveUserToGroup", fansController.moveUserToGroup)
  .post("/fans/checkGroup", fansController.checkGroup)

//创建二维码tag/qrCode/creat
router.post("/qrcode/createLimitQRCode", wechatQrCodeController.createLimitQRCode);
router.post("/qrcode/createTmpQRCode", wechatQrCodeController.createTmpQRCode);
router.get("/qrcode/list", wechatQrCodeController.list);
router.get("/qrcode/create", wechatQrCodeController.create);
router.post("/qrcode/createQrCode", wechatQrCodeController.createQrCode);
router.get("/qrcode/dataTable", wechatQrCodeController.dataTable);
router.get("/qrcode/delay/:id", wechatQrCodeController.delay);
router.get("/qrcode/qrCodeCountList/:id", wechatQrCodeController.qrCodeCountList);
router.get("/qrcode/qrCodeCountDatatable/:id", wechatQrCodeController.qrCodeCountDatatable);
//router.get("/qrcode/delete", wechatQrCodeController.delete);
router.get("/qrcode/scanQrCodeGroup/:id", wechatQrCodeController.scanQrCodeGroup);
router.get("/qrcode/scanGroup/top10/:id", wechatQrCodeController.scanQrCodeGroupTop10);
router.get("/qrcode/transfer/long2short", wechatQrCodeController.long2short);

//微信推广
var brandingCtrl = require('../controllers/WechatBrandingController');
router.get('/branding/index', brandingCtrl.index)
  .get("/branding/dataTable", brandingCtrl.dataTable)
  .get("/branding/approved/:id", brandingCtrl.approved)
  .get("/branding/del/:id", brandingCtrl.del)
  .get("/branding/group/:identifyNo", brandingCtrl.group)
  .get("/branding/wbDataTable/:identifyNo", brandingCtrl.wbDataTable)
  .post("/branding/setting/save", upload.any(), brandingCtrl.save)
  .post("/branding/setting/import", upload.any(), brandingCtrl.import)
  .get("/branding/qrcodeList", brandingCtrl.qrcodeList)
  .get("/branding/qrcodeDataTable", brandingCtrl.qrcodeDataTable)
  .post("/branding/exportCsv", brandingCtrl.exportCsv)
  .get("/branding/exportTotal", brandingCtrl.exportTotal)
  ;
//消息管理的路由
var messageCtrl = require('../controllers/WechatMessageController');
router.get(['/messages', '/message/index'], messageCtrl.index)
  .get("/message/dataTable", messageCtrl.dataTable)
  .get("/message/datatableColl", messageCtrl.datatableColl)
  .get("/message/tag/:id", messageCtrl.tag)
  .post("/message/save", messageCtrl.save)
  ;

//长链接转短链接
var urlCtrl = require('../controllers/ShortUrlController');
router.get(['/shortUrl', '/shortUrl/list'], urlCtrl.list)
  .get("/shortUrl/dataTable", urlCtrl.datatable)
  .get("/shortUrl/add", urlCtrl.add)
  .get("/shortUrl/edit/:id", urlCtrl.edit)
  .get("/shortUrl/del/:ids", urlCtrl.del)
  .post("/shortUrl/save", urlCtrl.save)
  .get("/shortUrl/redirectUrl", urlCtrl.redirectUrl)
  .get("/shortUrl/check", urlCtrl.check)

//群发消息
var sendMsgCtrl = require('../controllers/WechatSendMsgController');
router.get("/sendMsg/wechatGroup", sendMsgCtrl.findWechatGroup)
  .post("/sendMsg/send", sendMsgCtrl.sendMsg)//群发消息
  .get("/sendMsg/datatable", sendMsgCtrl.datatable)

//微信模板消息
var templateCtrl = require('../controllers/WechatMsgTemplateController');
router.get("/msgTemplate/list", templateCtrl.list)
  .get("/msgTemplate/datatable", templateCtrl.dataTable)
  .get("/msgTemplate/sync", templateCtrl.sync) //同步模板消息
  .get("/msgTemplate/del/:templateId", templateCtrl.del) //删除模板消息
  .get("/msgTemplate/detail/:templateId", templateCtrl.detail) //明细

var shareGroupCtrl = require('../controllers/WechatMenuShareGroupController');
router.get("/shareGroup/list", shareGroupCtrl.list)
  .get("/shareGroup/datatable", shareGroupCtrl.datatable)
  .post("/shareGroup/groupData", shareGroupCtrl.groupData)
  .get("/shareGroup/detail/:id", shareGroupCtrl.detail)
  .get("/shareGroup/detailDatatable", shareGroupCtrl.detailDatatable)
  .get("/shareGroup/export", shareGroupCtrl.export)
  .get("/shareGroup/exportDetail", shareGroupCtrl.exportDetail)
module.exports = router;
