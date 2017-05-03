'use strict';

var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../../../config/config');
var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });

var ctrl = require('./index.controller');

router
  .get(['/logout'], ctrl.logout)
  .get(['/auth'], ctrl.auth)
  .use(ctrl.nodes)
  .all(['/session'], ctrl.session)
  .get(['/fans/:fansId'], ctrl.fans)
  .use(ctrl.requiredSession)
  .get(['/topic/like/:id'], ctrl.like)
  .get(['/', '', '/home', '/home/:node'], ctrl.home)
  .get(['/topic/view/:id'], ctrl.view)
  .get(['/topic/new', '/topic/new/:node'], ctrl.nodes, ctrl.newTopic)
  .post(['/topic/new'], upload.none(), ctrl.newTopicSave)
  .get(['/topic/comments/:topicid'], ctrl.comments)
  .get(['/topic/comment/new/:topicid'], ctrl.newComment)
  .post(['/topic/comment/new/:topicid'], upload.none(), ctrl.newCommentSave)
  .get(['/topics', '/topics/:node'], ctrl.topics)
  .get(['/user'], ctrl.user);

router
  .get(['/fans/home/:fansId'], ctrl.fansHome)
  .get(['/fans/topics/:fansId'], ctrl.fansTopics)
  ;
module.exports = router;