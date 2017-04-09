/**
 * Created by danne on 2016/3/11.
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose');
var config = require('../../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;
var system = require(config.root + '/util/system');
var path = require("path");


var fileUtl = require(config.root + '/util/file');
var imgUtil = require(config.root + '/util/imgutil');

var Setting = mongoose.model('Setting');

/**
 * home page
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('system/index');
};

exports.base = function (req, res) {
  Channel.findOne({
    '_id': req.session.channelId
  }, function (err, channel) {
    res.render('system/base', {
      channel: channel
    });
  })
};

exports.baseSave = function (req, res) {
  var channelId = req.session.channelId;
  var saveOrUpdate = function (id, req, callback) {
    Channel.findOneAndUpdate({
      '_id': channelId
    }, req.body, {
      new: true
    }, function (err, channel) {
      req.session.channel = channel;
      callback(err, channel);
    });
  };
  var handleResult = function (err, result) {
    if (err) {
      req.flash('error', err.message);
    } else {
      req.flash('success', '数据保存成功!');
    }
    res.redirect('/system/base');
  };

  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(channelId, req, handleResult);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'logo', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.normalize(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          /*if (files && files.length > 0) {
           for (var i = 0; i < files.length; i++) {
           var fieldname = files[i].fieldname;
           console.log("********** setting  body %s - %s : ", fieldname, files[i].path);
           req.body[fieldname] = files[i];
           }
           }
           if (!req.body.logo) {
           delete req.body.logo
           }*/
          if (files) {
            req.body.logo = files[0].thumb;
          }
          // 更新时处理替换文件情况，新文件保存后旧文件删除
          Channel.findById(channelId, function (err, channel) {
            // queue files that should be removed.
            saveOrUpdate(channelId, req, handleResult);
          });
        })
      });
    });
  }
};


exports.mailSetting = function (req, res) {
  var channel = req.user.channelId; //会员所属渠道
  Channel.findOne({
    '_id': channel
  }, function (err, channel) {
    res.render('system/email/emailSetting', {
      channel: channel
    });
  });

};

exports.saveEmail = function (req, res) {
  var channel = req.user.channelId; //会员所属渠道
  Channel.findOne({
    '_id': channel
  }, function (err, channel) {
    if (req.body.ssl == 'on') {
      req.body.ssl = true;
    } else {
      req.body.ssl = false;
    }

    if (req.body.check == 'on') {
      req.body.check = true;
    } else {
      req.body.check = false;
    }
    channel.email = req.body;

    channel.save(function (err, reslult) {
      if (err) {
        console.log(err);
        req.flash('fail', '保存失败!');
      } else {
        req.flash('success', '保存成功!');
      }
      res.redirect('/system/mail');
    })
  });
};
