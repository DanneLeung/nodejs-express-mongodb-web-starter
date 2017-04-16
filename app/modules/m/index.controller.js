'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');

var User = mongoose.model('User');
var WechatFans = mongoose.model('WechatFans');
var Node = mongoose.model('Node');
var Topic = mongoose.model('Topic');

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
  Topic.findById(id).populate("fans").exec((err, topic) => {
    if(err) console.error(err);
    res.render('m/bbs/topic', { topic: topic ? topic : null });
  });
};

exports.new = function (req, res) {
  var node = req.params.node || req.query.node;
  res.render('m/bbs/form', { node: node ? node : '' });
};

exports.newSave = function (req, res) {
  var node = req.body.node;
  var openid = req.body.openid;
  if(!openid) {
    console.error(" openid");
    req.body.openid = openid = "oxVEQuN3xDA1r8aBD_hh-xMQeir4";
    // res.status(403).json({err:'粉丝信息没有传输，请确认!'});
  }
  if(!req.body.images || !req.body.images.length)
    req.body.images =[];
  console.log(" ************* topic body: ", req.body);
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

};

exports.home = function (req, res) {
  var node = req.params.node || req.query.node;
  res.render('m/bbs/home', { node: node ? node : '' });
};

exports.user = function (req, res) {
  res.render('m/user');
};