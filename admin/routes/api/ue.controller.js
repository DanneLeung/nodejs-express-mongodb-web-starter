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
exports.ue = function (req, res) {
  // 渠道识别
  var identity = req.session.channel.identity;
  if (!identity) {
    identity = "common";
  }

  // ueditor 客户发起上传图片请求

  if (req.query.action === 'uploadimage') {

    // 这里你可以获得上传图片的信息
    var foo = req.ueditor;
    console.log(foo.filename); // exp.png
    console.log(foo.encoding); // 7bit
    console.log(foo.mimetype); // image/png

    // 下面填写你要把图片保存到的路径 （ 以 path.join(__dirname, 'public') 作为根路径）
    var img_url = '/upload/ueditor/' + identity;
    res.ue_up(img_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
  }
  //  客户端发起图片列表请求
  else if (req.query.action === 'listimage') {
    var dir_url = '/upload/ueditor/'; // 要展示给客户端的文件夹路径
    res.ue_list(dir_url) // 客户端会列出 dir_url 目录下的所有图片
  }
  // 客户端发起其它请求
  else {

    res.setHeader('Content-Type', 'application/json');
    // 这里填写 ueditor.config.json 这个文件的路径
    res.redirect('/ueditor/ueditor.config.json')
  }

};
