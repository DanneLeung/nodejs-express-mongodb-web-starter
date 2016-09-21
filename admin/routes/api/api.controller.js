/**
 * Created by danne on 2016-04-19.
 */
var mongoose = require('mongoose');
var config = require('../../../config/config');
var async = require('async');
var moment = require('moment');
var url = require('url');
var path = require("path");
var fileUtl = require('../../../util/file');
var imgUtil = require('../../../util/imgutil');
/**
 * 文件上传，可以接受多个文件
 * @param req
 * @param res
 * @param next
 */
exports.upload = function(req, res) {
  // 渠道识别
  var identity = req.session.channel.identity;
  if(!identity) {
    identity = "common";
  }
  var zip = true;
  var type = req.query.type;
  var sizeKey = req.query.key;
  var size = [];
  if(sizeKey) {
    sizeKey = sizeKey.toLowerCase();
    if(sizeKey.indexOf('x'))
      size = sizeKey.split('x');
  }

  var temp = false;
  if(type == "xlsx") temp = true; //临时文件
  fileUtl.saveUploadFiles(req.files, identity, type, temp, function(fs) {
    if(type != 'images') return res.send(fs);
    if(!zip || !sizeKey) {
      fileUtl.saveFiles(fs, function(err, files) {
        if(err) console.error(err);
        res.send(files);
      });
    }
    //压缩图片
    imgUtil.thumbnail(fs, size, function(ffs) {
      console.log("********** files thumbnailed: " + JSON.stringify(ffs));
      fileUtl.saveFiles(ffs, function(err, files) {
        if(err) console.error(err);
        res.send(files);
      });
    });

  });
};
