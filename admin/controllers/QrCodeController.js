/**
 * Created by danne on 2016-04-27.
 */
var mongoose = require('mongoose')
  , _ = require('lodash')
  , ChannelWechat = mongoose.model('ChannelWechat')
  , config = require('../../config/config');

exports.index = function (req, res) {
  res.render('wechat/qrcode/index');
};
/**
 * 长链接转短链接并生成二维码
 * @param req
 * @param res
 */
exports.transfer = function (req, res) {
  res.render('wechat/qrcode/transfer');
};