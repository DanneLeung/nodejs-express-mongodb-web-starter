/**
 * Created by danne on 2016-04-28.
 */
/**
 * 贷款产品
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var validator = require('validator');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');
var LoanSetting = require('./loan.setting.model');
var Slide = mongoose.model('Slide');

/**
 * 贷款页面设置
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  LoanSetting.findOne({channel: req.session.channelId}, function(err, setting) {
    if(!err && setting) {
      res.render('bank/loan/setting/form', {sett: setting});
    }
    else {
      res.render('bank/loan/setting/form', {sett: new LoanSetting()});
    }
  });
};

/**
 * 获取轮播
 * @param req
 * @param res
 */
exports.getSlide = function (req, res) {
  Slide.find({channel: req.session.channelId, enabled: true}, function(err, slide) {
    if(err || !slide) {
      res.send({success: false, slide: null});
      return;
    }
    return res.send({success: true, slide: slide});
  });
};

/**
 * 贷款页面保存
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.needRegister = typeof req.body.needRegister == 'undefined' ? false : true;       //限粉丝
  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req, res);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'loan', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.normalize(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if (files) {
            for (var i = 0; i < files.length; i++) {
              var fieldname = files[i].fieldname;
              req.body[fieldname] = files[i].thumb;
            }
          }
          saveOrUpdate(id, req, res);
        })
      });
    });
  }
};

function saveOrUpdate(id, req, res) {
  if(id) {
    LoanSetting.findByIdAndUpdate(id, req.body, function (err, result) {
      handleSaved(req, res, err, result);
    });
  } else {
    req.body.channel = req.session.channelId;
    var sett = new LoanSetting(req.body);
    sett.save(function (err, result) {
      handleSaved(req, res, err, result);
    });
  }
}

//错误处理
function handleSaved(req, res, err, setting) {
  if (err) {
    req.flash('error', '保存失败!' + err);
    res.render('bank/loan/setting/form', {
      type: setting == null ? new LoanSetting() : setting
    });
  } else {
    req.flash('success', '保存成功!');
    res.redirect('/bank/loan/setting');
  }
}
