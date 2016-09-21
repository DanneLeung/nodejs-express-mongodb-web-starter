/**
 * 线下报名活动管理
 */

"use strict";

var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../../../../config/config');

var ctrl = require('./quiz.controller.js');
var poolCtrl = require('./quiz.pool.controller');
var runCtrl = require('./quiz.run.controller');
var answerCtrl = require('./quiz.answer.controller');
var upload = multer({'dest': config.file.local + '/upload/tmp/'});

router
    .get(['/', '/index'], ctrl.list)
    .get('/list/:poolId', ctrl.list)
    .all("/datatable/:poolId", ctrl.datatable)
    .all("/datatables/:poolId", ctrl.datatables)
    .get('/add/:poolId', ctrl.add)
    .post('/save', ctrl.save)
    .get('/edit/:poolId/:id', ctrl.edit)
    .get('/enable/:id', ctrl.enable)
    .get('/multi/:id', ctrl.multi)
    .all('/del/:poolId/:ids', ctrl.del)
    .get('/checkName', ctrl.checkName)

    //题库的路由
    .get(['/pool', '/pool/index'], poolCtrl.list)
    .all("/pool/datatable", poolCtrl.datatable)
    .get('/pool/add', poolCtrl.add)
    .post('/pool/save', upload.any(), poolCtrl.save)
    .get('/pool/edit/:id', poolCtrl.edit)
    .get('/pool/enable/:id', poolCtrl.enable)
    .get('/pool/checkName', poolCtrl.checkName)
    .get('/pool/getQuizPools', poolCtrl.getQuizPools)
    .all('/pool/del/:ids', poolCtrl.del)
    .post('/pool/addQuiz', poolCtrl.addQuizs)
    .post('/pool/revokeQuiz', poolCtrl.revokeQuizs)

    //题库的路由
    .get(['/run', '/run/list'], runCtrl.list)
    .all("/run/datatable", runCtrl.datatable)
    .get('/run/add', runCtrl.add)
    .post('/run/save', upload.any(), runCtrl.save)
    .get('/run/edit/:id', runCtrl.edit)
    .get('/run/getLevel/:id', runCtrl.getLevel)
    .get('/run/enable/:id', runCtrl.enable)
    //.get('/run/checkName', runCtrl.checkName)
    .all('/run/del/:ids', runCtrl.del)

    //关卡信息的路由
    .get('/run/searchLevel/:id', runCtrl.searchLevel)
    .get('/run/addLevel/:id', runCtrl.addLevel)
    .post('/run/levelSave', runCtrl.levelSave)
    .get('/run/editLevel/:id/:index', runCtrl.editLevel)
    .get('/run/delLevel/:id/:index', runCtrl.delLevel)

    //统计和查询的路由
    .get('/stat/:id', answerCtrl.statList)
    .get('/getDataByDay/:id', answerCtrl.getDataByDay)
    .get('/getDataByWeek/:id', answerCtrl.getDataByWeek)
    .get('/getDataByMonth/:id', answerCtrl.getDataByMonth)
    .get('/answer/datatable/:id', answerCtrl.datatable)
    .get('/answer/export/:id', answerCtrl.export)

;
module.exports = router;
