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
var Comment = mongoose.model('Comment');

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

exports.home = function (req, res) {
  var node = req.params.node || req.query.node;
  Topic.topTopics(node, (topTopics) => {
    res.render('m/bbs/home', { node: node ? node : '', topTopics: topTopics });
  });
};

exports.topics = function (req, res) {
  var node = req.params.node || req.query.node;
  var offset = parseInt(req.params.offset || req.query.offset || 0);
  var limit = parseInt(req.params.limit || req.query.limit || 10);
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
      var offset = 0,
        limit = 5;
      Comment.commentsByTopicId(id, offset, limit, (err, comments) => {
        if(err) console.error(err);
        res.render('m/bbs/topic', { topic: topic ? topic : null, offset: offset + limit, limit: limit, comments: comments ? comments : [] });
      });
    });
  });
};

exports.newTopic = function (req, res) {
  var node = req.params.node || req.query.node;
  res.render('m/bbs/form', { node: node ? node : '' });
};

exports.newTopicSave = function (req, res) {
  var appid = req.body.appid || req.session.appid;
  var node = req.body.node || null;
  var openid = req.body.openid;
  var serverIds = req.body.serverIds || [];
  console.log(" ************* topic body : ", req.body);

  if(!node) {
    delete req.body.node;
  }

  if(!openid) {
    req.body.openid = openid = "oxVEQuN3xDA1r8aBD_hh-xMQeir4";
    // return res.status(403).json({ err: '粉丝信息没有传输，请确认!' });
  }

  if(!appid) {
    return res.status(500).json({ err: '公众号配置信息错误，请确认!' });
  }

  downloadMedia(appid, serverIds, (err, serverIds, images) => {
    if(err) return res.status(200).json({ err: err });
    req.body.serverIds = serverIds;
    req.body.images = images;
    console.log(" ************* topic body will be saved: ", images, req.body);
    WechatFans.findOne({ openid: openid }, (err, fans) => {
      if(err) console.error(err);
      var topic = new Topic(req.body);
      topic.fans = fans;
      topic.save((err, t) => {
        if(err) console.error(err);
        return res.status(200).json(t);
        // res.redirect(req.absBaseUrl + '/home', { node: node ? node : '' });
      });
    });
  });
};

exports.comments = function (req, res) {
  var topicid = req.params.topicid || req.query.topicid;
  var offset = req.params.offset || req.query.offset;
  var limit = req.params.limit || req.query.limit;
  Comment.commentsByTopicId(topicid, offset, limit, (err, comments) => {
    if(err) console.error(err);
    res.render('m/bbs/comments', { offset: offset + limit, limit: limit, comments: comments ? comments : [] });
  });
};

exports.newComment = function (req, res) {
  var topicid = req.params.topicid || req.query.topicid;
  Topic.findById(topicid, (err, topic) => {
    if(err) {
      console.error(err);
    }
    res.render('m/bbs/commentForm', { topic: topic, topicid: topicid ? topicid : '' });
  });
};

exports.newCommentSave = function (req, res) {
  var appid = req.body.appid || req.session.appid;
  var topicid = req.params.topicid || req.query.topicid;
  var openid = req.body.openid || req.session.openid;
  var serverIds = req.body.serverIds || [];
  console.log(" ************* topic body : ", req.body);

  if(!openid) {
    req.body.openid = openid = "oxVEQuN3xDA1r8aBD_hh-xMQeir4";
    // return res.status(403).json({ err: '粉丝信息没有传输，请确认!' });
  }

  if(!appid) {
    return res.status(500).json({ err: '公众号配置信息错误，请确认!' });
  }
  downloadMedia(appid, serverIds, (err, serverIds, images) => {
    if(err) return res.render("m/bbs/commentItem");
    req.body.serverIds = serverIds;
    req.body.images = images;
    console.log(" ************* topic body will be saved: ", images, req.body);
    WechatFans.findOne({ openid: openid }, (err, fans) => {
      if(err) console.error(err);
      var comment = new Comment(req.body);
      comment.fans = fans;
      comment.topic = topicid;
      comment.save((err, c) => {
        if(err) console.error(err);
        Topic.incsCountField(topicid, 'commentCount', (err, result) => {
          res.render("m/bbs/commentItem", { comment: c });
        })
        // res.redirect(req.absBaseUrl + '/home', { node: node ? node : '' });
      });
    });
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

function downloadMedia(appid, serverIds, callback) {
  if(_.isArray(serverIds)) {} else if(serverIds && serverIds.indexOf(',')) {
    serverIds = serverIds.split(",");
  } else {
    serverIds = [serverIds];
  }

  //读取微信公众号配置
  Wechat.findByAppid(appid, (err, wechat) => {
    if(err) {
      console.error(err);
      return callback(err)
    }
    // res.status(200).json({ error: 1, msg: '公众号配置信息错误，图片无法上传' });
    var mutil = new mediaUtil(appid, wechat.appsecret);
    async.map(serverIds, (serviceId, callback) => {
      mutil.getMedia(serviceId, (err, wm) => {
        console.log(" >>>>>>>>>>>>> getMedia ", wm);
        return callback(null, wm ? wm.path : '');
      });
    }, (err, images) => {
      // req.body.images = _.remove(images, (el) => { return !el; });
      return callback(err, serverIds, images);
    });
  });
}