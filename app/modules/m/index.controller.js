'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var config = require('../../../config/config');
var mediaUtil = require(config.root + '/util/wechat/mediaUtil');

var User = mongoose.model('User');
var Wechat = mongoose.model('Wechat');
var WechatFans = mongoose.model('WechatFans');
var Node = mongoose.model('Node');
var Topic = mongoose.model('Topic');

const fieldMsg = { likeCount: '点赞', heartCount: '收藏' };

exports.nodes = function (req, res, next) {
  Node.enabledNodes((nodes) => {
    res.locals.nodes = nodes;
    next();
  });

};

exports.index = function (req, res) {
  res.render('m/index');
};

exports.topics = function (req, res) {
  var node = req.params.node || req.query.node;
  var offset = req.query.offset || 0;
  var limit = 10;
  Topic.topicsWithNode(node, offset, limit, (topics) => {
    res.render('m/bbs/topics', { topics: topics });
  });
};

exports.view = function (req, res) {
  var id = req.params.id || req.query.id;
  if(!id) {
    return res.render('m/bbs/topic', { topic: null });
  }
  Topic.incsCountField(id, 'readCount', (err, result) => {
    if(err) console.error(err);
    console.log(result);
    Topic.findById(id).populate("node fans user comments").exec((err, topic) => {
      if(err) console.error(err);
      res.render('m/bbs/topic', { topic: topic ? topic : null, comments: topic.comments ? topic.comments : [] });
    });
  });
};

exports.new = function (req, res) {
  var node = req.params.node || req.query.node;
  res.render('m/bbs/form', { node: node ? node : '' });
};

exports.newSave = function (req, res) {
  var appid = req.body.appid || req.session.appid;
  var node = req.body.node || null;
  var openid = req.body.openid;
  var serviceIds = req.body.serviceIds || [];
  console.log(" ************* topic body : ", req.body);

  if(!node) {
    delete req.body.node;
  }

  if(!openid) {
    req.body.openid = openid = "oxVEQuN3xDA1r8aBD_hh-xMQeir4";
    // return res.status(403).json({ err: '粉丝信息没有传输，请确认!' });
  }

  if(!appid) {
    return res.status(403).json({ err: '公众号配置信息错误，请确认!' });
  }
  if(_.isArray(serviceIds)) {} else if(serviceIds && serviceIds.indexOf(',')) {
    serviceIds = serviceIds.split(",");
  } else {
    serviceIds = [serviceIds];
  }
  req.body.serviceIds = serviceIds;

  //读取微信公众号配置
  Wechat.findByAppid(appid, (err, wechat) => {
    if(err) res.status(200).json({ error: 1, msg: '公众号配置信息错误，图片无法上传' });
    var mutil = new mediaUtil(appid, wechat.appsecret);
    async.map(serviceIds, (serviceId, callback) => {
      mutil.getMedia(serviceId, (err, wm) => {
        console.log(" >>>>>>>>>>>>> getMedia ", wm);
        return callback(err, wm ? wm.path : '');
      });
    }, (err, result) => {
      req.body.images = _.remove(result, (el) => { return !el; });
      // req.body.images = result;
      console.log(" ************* topic body will be saved: ", result, req.body);

      WechatFans.findOne({ openid: openid }, (err, fans) => {
        if(err) console.error(err);
        var topic = new Topic(req.body);
        topic.fans = fans;
        topic.save((err, t) => {
          if(err) console.error(err);
          res.status(200).json(t);
          // res.redirect(req.absBaseUrl + '/home', { node: node ? node : '' });
        });
      });
    });
  });
};

exports.home = function (req, res) {
  var node = req.params.node || req.query.node;
  Topic.topTopics(node, (topTopics) => {
    res.render('m/bbs/home', { node: node ? node : '', topTopics: topTopics });
  });
};

exports.user = function (req, res) {
  res.render('m/user');
};

exports.like = function (req, res) {
  exports.increase(req, res, 'likeCount');
};

exports.increase = function (req, res, field) {
  var id = req.params.id || req.query.id;
  Topic.incsCountField(id, field, (err, result) => {
    var ok = {};
    if(err) {
      console.error(err);
      ok.error = 1;
      ok.msg = '数据处理时发生错误!';
      return res.status(200).json(ok);
    }
    ok.msg = '成功' + (fieldMsg[field] ? fieldMsg[field] : '处理') + '!';
    return res.status(200).json(ok);
  });
};