/**
 * 投票模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var ctrl = require('./coupon.controller');
var multer = require('multer');
var config = require('../../../../config/config');

var upload = multer({'dest': config.file.local + '/upload/tmp/'});

router.get(['/', '/index'], function (req, res) {
    res.redirect('/shop/coupon/list')
  })
  .get(["/list"], ctrl.list)
  .all("/datatable", ctrl.couponsDatatable)
  .get("/create", ctrl.couponsCreate)
  .post("/save", ctrl.couponsSave)
  .post("/del", ctrl.couponsDel)
  .get("/edit/:id", ctrl.couponsEdit)
  .get("/checkCode", ctrl.checkCode)
  .get("/checkName", ctrl.checkName)
  .get("/isEnable/:id", ctrl.enable)
  .post("/createCoupons", ctrl.createCoupons)
  .all("/item/datatable", ctrl.datatable)
  .get("/item/exportCoupon", ctrl.exportCoupon)
  .post("/item/importCoupons",upload.any(), ctrl.importCoupon)
  .get(["/item/list/:couponId"], ctrl.couponList)
  .all("/item/list/datatable/:couponId", ctrl.couponListDatatable)
  .all("/item/list/isEnable/:id", ctrl.listEnable)
  .post("/item/del", ctrl.itemDel)
  .get("/stats", ctrl.getCouponList)
  .get("/exportStatList", ctrl.exportStatList)
  .all("/stat/datatable", ctrl.statDatatable)
  .get("/stat/getCompany", ctrl.getCompany)
  .get("/stat/getBranch", ctrl.getBranch)
  .get("/stat/getCoupon", ctrl.getCoupon)
;

module.exports = router;
