/**
 * Created by danne on 2016/3/11.
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var nodeCtrl = require('./node.controller');
var topicCtrl = require('./topic.controller');
var commentCtrl = require('./comment.controller');

var multer = require('multer');
var upload = multer({
  'dest': config.file.local + '/upload/tmp/'
});

router.use(Auth.requiresLogin);

router.get('/', (req, res) => {
  res.render('admin/bbs/index');
});

//版块
router.get("/node", nodeCtrl.list)
  .all("/node/datatable", nodeCtrl.datatable)
  .post("/node/save", nodeCtrl.save)
  .get("/node/unique", nodeCtrl.checkName)
  .post("/node/del", nodeCtrl.del)
  .get("/node/edit/:id", nodeCtrl.edit)
  .get("/node/add", nodeCtrl.add)
  .get("/node/enable/:id", nodeCtrl.enable);

router
  .get(["/topic"], topicCtrl.nodes, topicCtrl.list)
  .get(["/topic2"], topicCtrl.nodes, topicCtrl.list2)
  .all(["/topic/datatable", "/topic/datatable/:node"], topicCtrl.datatable)
  .post("/topic/save", topicCtrl.save)
  .all(["/topic/del", "/topic/del/:id"], topicCtrl.del)
  .get("/topic/edit/:id", topicCtrl.nodes, topicCtrl.edit)
  .get("/topic/add", topicCtrl.nodes, topicCtrl.add)
  .get("/topic/top/:id", topicCtrl.top)
  .get("/topic/block/:id", topicCtrl.block)
  .get("/topic/hot/:id", topicCtrl.hot)
  .get("/topic/enable/:id", topicCtrl.enable)
  .get(['/topic/comments/:topicid'], topicCtrl.comments)
  .post(['/topic/comments/new', '/topic/comments/new/:topicid'], topicCtrl.newComment);

router.get("/comment", commentCtrl.list)
  .all("/comment/datatable", commentCtrl.datatable)
  .post("/comment/del", commentCtrl.del)
  .get("/comment/view/:id", commentCtrl.view)
  .get("/comment/block/:id", commentCtrl.block)
  .get("/comment/hot/:id", commentCtrl.hot);

module.exports = router;