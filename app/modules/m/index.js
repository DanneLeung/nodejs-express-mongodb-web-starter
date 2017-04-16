'use strict';

var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('../../../config/config');
var upload = multer({ 'dest': config.file.local + '/upload/tmp/' });

var ctrl = require('./index.controller');

router
  .use(ctrl.nodes)
  .get(['/'], ctrl.index)
  .get(['/topic/view/:id'], ctrl.view)
  .get(['/topic/new', '/topic/new/:node'], ctrl.new)
  .post(['/topic/new'], upload.any(), ctrl.newSave)
  .get(['/topics', '/topics/:node'], ctrl.topics)
  .get(['/home', '/home/:node'], ctrl.home)
  .get(['/user'], ctrl.user);
module.exports = router;