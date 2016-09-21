/**
 * Created by yu869 on 2016/1/11.
 * yufan
 */

"use strict";
var express = require('express');
var router = express.Router();

var multer = require('multer');

var config = require('../../../../config/config');

var upload = multer({
  'dest': config.file.local + '/upload/tmp/'
});

//控制器
var ctrl = require('./product.controller.js');
var linkCtrl = require('./product.link.controller.js');
var pageCtrl = require('./product.page.controller.js');
var attributeCtrl = require('./product.attribute.controller.js');
var optionCtrl = require('./product.option.controller.js');
var commentCtrl = require('./product.comment.controller.js');
//控制器
var categoryCtrl = require('./category.controller.js');
// 系统管理下均需要授权SS
//router.all("/*", Auth.requiresLogin);

//使用express4,var Router = express.Router().相当于一个简单的app,在Router上面装备控制器与中间件1

//渠道管理员的设置
router.use(function (req, res, next) {
  var types = {'c': '自定义', 'fs': '限时秒杀', 'fp': '限时抢购', 'pd': '满减'};
  res.locals.types = types;
  next();
});
router
  .get(["/", "/index"], ctrl.index)
  .get(["/form", "/form/:id"], ctrl.form)
  .all("/datatable", ctrl.datatable)
  .get("/add", ctrl.add)
  .get("/edit/:id", ctrl.edit)
  .get("/checkNo", ctrl.checkNo)
  .post("/save", upload.any(), ctrl.save)
  .get("/enable/:id", ctrl.enable)
  .get("/down/:id", ctrl.down)
  .post("/up", ctrl.up)
  .post("/del", ctrl.del);
router
  .get(["/link", "/link/list"], linkCtrl.linkList)
  .get("/link/add", linkCtrl.add)
  .get("/link/edit/:id", linkCtrl.edit)
  .post("/link/save", upload.any(), linkCtrl.save)
  .post("/link/del", linkCtrl.del)
  .all("/link/datatable", linkCtrl.linkdatatable)
  .all("/link/findDatatable/:id", linkCtrl.findDatatable)//查询发布的产品
  .all("/link/findTopDatatable/:id", linkCtrl.findTopDatatable)//查询置顶产品
  .all("/link/Rdatatable", linkCtrl.Rdatatable)
  .get("/link/release/list", linkCtrl.releaseList)
  .post("/link/releaseProduct", linkCtrl.releaseProduct)//发布产品信息
  .post("/link/addProduct", linkCtrl.addProduct)//添加产品到已有的发布信息中
  .post("/link/addTopProducts", linkCtrl.addTopProducts)//添加产品置顶
  .post("/link/delRelease", linkCtrl.delRelease)//删除发布信息
  .get("/link/setPosition/:releaseIds", linkCtrl.setPosition)//发布产品
  .post("/link/remeveProduct", linkCtrl.remeveProduct)//删除发布信息中的产品
  .post("/link/revokeTopProducts", linkCtrl.revokeTopProducts)//取消置顶
  .get("/link/findProduct/:id", linkCtrl.findProduct)
  .get("/link/checkTitle", linkCtrl.checkTitle)
  .get("/link/checkName", linkCtrl.checkName)
  .get("/link/checkNo", linkCtrl.checkNo)
  .get("/link/getAllRelease", linkCtrl.getAllRelease)
  .get("/link/cancelRelease/:id", linkCtrl.cancelRelease)
  .post("/link/upload", upload.any(), linkCtrl.upload)
  .get("/link/site/release/:id", linkCtrl.siteRelease)
  .get("/link/site", linkCtrl.site);
router
  .get("/page/list", pageCtrl.index)
  .get("/page/add", pageCtrl.add)
  .get("/page/edit/:id", pageCtrl.edit)
  .post("/page/save", pageCtrl.save)
  .get("/page/del/:ids", pageCtrl.del)
  .all("/page/datatable", pageCtrl.datatable)
  .get("/page/checkName", pageCtrl.checkName)
  .get("/page/getPages", pageCtrl.getPages)
;
router.get(['/category', '/category/list'], categoryCtrl.list)
  .all("/category/datatable", categoryCtrl.datatable)
  .get("/category/checkName", categoryCtrl.checkName)
  .get("/category/checkCode", categoryCtrl.checkCode)
  .get("/category/add", categoryCtrl.add)
  .get("/category/getChildren", categoryCtrl.getChildren)
  .get("/category/edit/:id", categoryCtrl.edit)
  .get("/category/isEnable/:id", categoryCtrl.enable)
  .get("/category/topNav/:id", categoryCtrl.topNav)
  .all("/category/del", categoryCtrl.del)
  .post("/category/saveSort", categoryCtrl.saveSort)
  .post("/category/save", categoryCtrl.save);
//属性分组的控制
router.get('/attribute/groupList', attributeCtrl.groupList)
  .all("/attribute/datatable_group", attributeCtrl.datatable_group)
  .get("/attribute/checkName_group", attributeCtrl.checkName_group)
  .get("/attribute/add_group", attributeCtrl.add_group)
  .get("/attribute/edit_group/:id", attributeCtrl.edit_group)
  .get("/attribute/getStore", attributeCtrl.getStore)
  .all("/attribute/del_group/:ids", attributeCtrl.del_group)
  .post("/attribute/saveSort_group", attributeCtrl.saveSort_group)
  .post("/attribute/save_group", attributeCtrl.save_group);
//属性的控制
router.get('/attribute/list/:groupId', attributeCtrl.list)
  .all("/attribute/datatable/:groupId", attributeCtrl.datatable)
  .get("/attribute/checkName", attributeCtrl.checkName)
  .get("/attribute/add/:groupId", attributeCtrl.add)
  .get("/attribute/edit/:groupId/:id", attributeCtrl.edit)
  .get("/attribute/getStore", attributeCtrl.getStore)
  .get("/attribute/getAttributes", attributeCtrl.getAttributes)
  .all("/attribute/del/:groupId/:ids", attributeCtrl.del)
  .post("/attribute/saveSort/:groupId", attributeCtrl.saveSort)
  .post("/attribute/save/:groupId", attributeCtrl.save);

//选项的控制
router.get('/option/list', optionCtrl.list)
  .all("/option/datatable", optionCtrl.datatable)
  .get("/option/checkName", optionCtrl.checkName)
  .get("/option/add", optionCtrl.add)
  .get("/option/edit/:id", optionCtrl.edit)
  .all("/option/del/:ids", optionCtrl.del)
  .post("/option/saveSort", optionCtrl.saveSort)
  .post("/option/save", optionCtrl.save);

//选项的控制
router.get('/comment/list', commentCtrl.list)
  .all("/comment/datatable", commentCtrl.datatable)
  .get("/comment/edit/:id", commentCtrl.edit)
  .get("/comment/product", commentCtrl.get_product_select)
  .get("/comment/order", commentCtrl.get_order_select)
  .get("/comment/member", commentCtrl.get_member_select)
  .get("/comment/display/:id", commentCtrl.display)
  .all("/comment/del/:ids", commentCtrl.del)
  .post("/comment/save", commentCtrl.save);

module.exports = router;
