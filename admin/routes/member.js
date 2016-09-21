"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var Auth = require(config.root + '/middleware/authorization');
var multer = require('multer');

//用户控制器
var memberController = require('../controllers/MemberController');
var memberScoreController = require('../controllers/MemberScoreController');
var memberGroupController = require('../controllers/MemberGroupController');
var wechatGroupController = require('../controllers/WechatGroupController');
var memberActionController = require('../controllers/MemberActionController');
var companyController = require('../controllers/CompanyController');

var upload = multer({'dest': config.file.local + '/upload/tmp/'});

//使用express4,var Router = express.Router().相当于一个简单的app,在Router上面装备控制器与中间件
router.use(Auth.requiresLogin);
router
    .get(['/', '/index'], memberController.index)
    //会员分组
    .get('/group/list/', memberGroupController.groupList)
    .all("/group/datatable", memberGroupController.datatable)
    .get('/group/edit/:id', memberGroupController.edit)
    .get('/group/add', memberGroupController.add)
    .get('/group/checkname', memberGroupController.checkName)
    .get('/group/all', memberGroupController.getAllGroup)
    .post('/group/del/', memberGroupController.del)
    .post('/group/save/', memberGroupController.save)
    .post('/setGroup', memberGroupController.setGroup)

    //会员信息的访问地址
    .get('/memberinit', memberController.init)
    .get('/list', memberController.list)
    .post('/memberDel', memberController.memberDel)
    .all("/memberDatatable", memberController.datatable)
    .all("/exportMember", memberController.exportMember)
    .get("/isEnable/:id", memberController.enable)
    .get("/resetPwd/:id", memberController.resetPwd)
    .post("/setMemberGroup", memberController.setMemberGroup)
    .post("/importMember", memberController.importMember)

    .get('/action/list', memberActionController.list)
    .all("/action/datatable", memberActionController.datatable)
    .all("/action/datatables", memberActionController.datatables)
    .get('/action/edit', memberActionController.edit)
    .get('/action/add', memberActionController.add)
    .post('/action/del', memberActionController.del)
    .post('/action/save', memberActionController.save)
    .post('/action/setAction', memberActionController.setAction)
    .get("/action/checkName", memberActionController.checkName)
    .get("/action/checkCode", memberActionController.checkCode)

    //记录
    .all("/score/datatableScore", memberActionController.datatableScore)
    //积分记录控制
    .get('/score/list', memberScoreController.list)
    .all("/score/datatable", memberScoreController.datatable)

    //公司信息的管理
    .get('/company/list', companyController.list)
    .all("/company/datatable", companyController.datatable)
    .get('/company/edit/:id', companyController.edit)
    .get('/company/add', companyController.add)
    .get("/company/checkName", companyController.checkName)
    .get('/company/del/:id', companyController.del)
    .get('/company/enable/:id', companyController.enable)
    .get('/company/getSettRing/:id', companyController.getSettRing)
    .post('/company/save', upload.any(), companyController.save)
;

module.exports = router;
