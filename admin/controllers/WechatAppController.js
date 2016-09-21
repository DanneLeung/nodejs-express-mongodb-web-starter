/**
 * Created by ZhangXiao on 2016/3/10.
 * 微信二维码
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var async = require("async");
var moment = require("moment");

var config = require('../../config/config');
var WechatApp = mongoose.model('WechatApp');
var App = mongoose.model('App');

exports.appList = function (req, res) {
    var cid = req.session.channelId;
    var wid = req.session.wechatId;
    //渠道渠道设置App
    App.find({}, function (err, apps) {
        if (err) console.error(err);
        res.render("wechat/apps/appList", {
            apps: apps
        });
    });
}

exports.list = function (req, res) {
    var cid = req.session.channelId;
    var wid = req.session.wechatId;
    //渠道渠道设置App
    WechatApp.find({
        'channel': cid,
        'wechat': wid
    }).populate('app').exec(function (err, apps) {
        if (err) console.error(err);
        res.render("wechat/apps/appList", {
            apps: apps
        });
    });
}

// exports.save = function (req, res) {
//   var id = req.params.id || req.query.id || req.body.id;
//   WechatApp.findOneAndUpdate({
//     '_id': id
//   }, req.body, {
//     new: true
//   }, function (err, app) {
//     res.redirect("/wechat/apps");
//   })
// }

/**
 **/
exports.enable = function (req, res) {
    var id = req.params.id || req.query.id || req.body.id;
    var enabled = req.query.enabled || req.body.enabled || false;
    WechatApp.findOneAndUpdate({
        '_id': id
    }, {
        enabled: enabled
    }, {
        new: true
    }, function (err, app) {
        if (err) console.error(err);
        res.status(200).json(app);
    })
}

/**
 **/
exports.addAppToWechat = function (req, res) {
    var cid = req.session.channelId;
    var wid = req.session.wechat._id;
    var appId = req.params.appId;
    WechatApp.count({
        'app': appId,
        'channel': cid,
        'wechat': wid
    }, function (err, apps) {
        if (apps > 0) {
            res.send("该应用已经添加，不可再添加");
        } else {
            var wapp = new WechatApp();
            wapp.channel = cid;
            wapp.wechat = wid;
            wapp.app = appId;
            wapp.save(function (err, apps) {
                if(!err){
                    res.send("该应用已经添加成功");
                }else{
                    res.send(err);
                }
            });
        }
    });
}
