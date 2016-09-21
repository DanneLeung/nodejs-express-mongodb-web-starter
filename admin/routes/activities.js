/**
 * Created by danne on 2016/3/11.
 * 活动相关子模块路由，管理activities目录下各模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../../config/config');
var passport = require('passport');
var Auth = require(config.root + '/middleware/authorization');
var fs = require('fs');

var ctrl = require('../controllers/ActivityController');
var awardctrl = require('../controllers/AwardController');
var whiteCtrl = require('../controllers/WhiteListController');
var statCtrl = require('../controllers/ActivityStatController');
var playerCtrl = require('../controllers/ActivityPlayerController');

var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });
// Routers
var requireWechat = function (req, res, next) {
  var wechatId = req.params.wechatId || req.query.wechatId || req.body.wechatId;
  // console.log('********** requireWechat ', req.params.wechatId);
  if (!wechatId && !req.session.wechat) {
    res.redirect('/wechat/index');
  } else {
    next();
  }
};
router.use(requireWechat);
router.use(Auth.requiresLogin);
// load activities modules
var modulePath = __dirname + '/' + 'activities';
fs.readdirSync(modulePath).forEach(function (file) {
  if (file.indexOf('.') < 0) {
    var module = "./activities/" + file;
    var p = "/";
    if (!('index' == file || 'home' == file)) {
      p = p + file;
    }
    console.log("**** activities module routes " + p + " to " + module);
    // module routes
    router.use(p, require(module));
    // module static contents
    router.use(p, express.static(__dirname + '/' + module + '/static'));
  }
});
//
//router
////微信粉丝分组
//  .get('/', linkCtrl.index)
//;

router
  //重定向到列表页
  .get(['/'], function (req, res) {
    res.render('activities/index');
  })
  .get(['/list', '/index'], ctrl.list)
  .get('/datatable', ctrl.datatable)
  .get('/add', ctrl.add)
  .get('/edit/:id', ctrl.edit)
  .get('/copy/:id', ctrl.copy)
  .get('/online/:id', ctrl.online)
  .get('/checkName', ctrl.checkName)
  .get('/getAwards/:id', ctrl.getAwards)
  .get('/selectAward', ctrl.get_award_select)
  .get('/getByActivityAwards/:id', ctrl.getByActivityAwards)
  .get('/getActivities', ctrl.getActivities)
  .all('/del/:ids', ctrl.del)
  .post('/save', ctrl.save)

  //奖项设置
  .use(function (req, res, next) {
    res.locals.types = { '0': '实物奖品', '1': '电影，演出票', '2': '优惠券', '3': '其他兑换码' };
    next();
  })
  .get(['/award', '/award/list'], awardctrl.list)
  .get('/award/datatable', awardctrl.datatable)
  .get('/award/add', awardctrl.add)
  .get('/award/edit/:id', awardctrl.edit)
  .get('/award/del/:ids', awardctrl.del)
  .get('/award/enable/:id', awardctrl.enable)
  .post('/award/save', upload.any(), awardctrl.save)
  .get('/award/checkName', awardctrl.checkName)
  .get('/award/getAwards', awardctrl.getAwards)
  .get('/award/returnAward/:awardId', awardctrl.returnAward)

  .get('/award/item/datatable/:awardId', awardctrl.datatableItem)
  .post("/award/item/importItem", upload.any(), awardctrl.importItem)
  .get('/award/item/list/:awardId', awardctrl.itemLis)
  .get('/award/item/export/:awardId', awardctrl.export)


  //白名单设置
  .get(['/whitelist', '/white/list'], whiteCtrl.list)
  .get('/white/datatable', whiteCtrl.datatable)
  .get('/white/add', whiteCtrl.add)
  .get('/white/edit/:id', whiteCtrl.edit)
  .get('/white/del/:ids', whiteCtrl.del)
  .get('/white/enable/:id', whiteCtrl.enable)
  .get('/white/getMobiles/:id', whiteCtrl.getMobiles)
  .get('/white/getWhite', whiteCtrl.getWhite)
  .post('/white/save', upload.any(), whiteCtrl.save)
  .post('/white/importWhite', whiteCtrl.importWhite)
  .get('/white/checkName', whiteCtrl.checkName)

  //统计路由
  .get('/stats/:id', statCtrl.stat)
  .get('/getDataByDay/:activityId', statCtrl.getDataByDay)
  .get('/getDataByWeek/:activityId', statCtrl.getDataByWeek)
  .get('/getDataByMonth/:activityId', statCtrl.getDataByMonth)
  .get('/init', statCtrl.init)
  .get('/LogDatatable/:activityId', statCtrl.datatable)
  .get('/player/export/:activityId', statCtrl.export)
  //参与用户等
  .get('/players/:id', playerCtrl.index)
  .get('/players/datatable/:id', playerCtrl.datatable)
  .get('/players/download/:id', playerCtrl.p_download)

  //参与用户等
  .get('/record/:id', playerCtrl.r_list)
  .get('/record/datatable/:id', playerCtrl.r_data_table)
  .get('/record/download/:id', playerCtrl.download)





  ;
module.exports = router;
