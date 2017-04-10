/**
 * Created by danne on 2016/3/11.
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var nodeCtrl = require('./node.controller');

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

module.exports = router;