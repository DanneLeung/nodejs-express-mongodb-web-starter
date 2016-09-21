/**
 * Created by yu869 on 2016/3/17.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../config/config');
var ChannelPayment = mongoose.model('ChannelPayment');
var PaymentMethod = mongoose.model('PaymentMethod');
var Coupon = mongoose.model('Coupon');
var CouponList = mongoose.model('CouponList');
var Channel = mongoose.model('Channel');
var moment = require('moment');
var async = require('async');


/**
 * 检查渠道标识
 * @param req
 * @param res
 */
exports.checkIdentity = function (req, res) {
  var identity = req.query.identity;
  Channel.count({identity: identity}, function (err, result) {
    if (result > 0) {
      res.send('false');
    } else {
      res.send('true');
    }
  });
};


function pad(title, startNum) {
  var allLen = (title + startNum).length;
  var len = 16;
  while (allLen < len) {
    title = title + "0";
    allLen = (title + startNum).length;
  }
  return title + startNum;
}


exports.saveEmail = function (req, res) {
  var channel = req.user.channelId;//会员所属渠道
  console.log("channel", "==========================>", channel);
  Channel.findOne({'_id': channel}, function (err, channel) {
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
      res.redirect('/sms/mailSetting');
    })

  });
};