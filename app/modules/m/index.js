'use strict';

var express = require('express');

var ctrl = require('./index.controller');
var router = express.Router();

router
  .get(['/'], ctrl.index)
  .get(['/home'], ctrl.home)
  .get(['/user'], ctrl.user);
module.exports = router;