'use strict';

var express = require('express');

var ctrl = require('./index.controller');
var router = express.Router();

router
  .use(ctrl.nodes)
  .get(['/'], ctrl.index)
  .get(['/topics','/topics/:node'], ctrl.topics)
  .get(['/home'], ctrl.home)
  .get(['/user'], ctrl.user);
module.exports = router;