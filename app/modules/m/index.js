'use strict';

var express = require('express');

var ctrl = require('./index.controller');
var router = express.Router();
router.use((req, res, next) => {
  return next();
});
router.get(['/', '/index'], ctrl.index);
module.exports = router;