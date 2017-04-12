'use strict';

var express = require('express');

var ctrl = require('./index.controller');
var router = express.Router();
router.use((req, res, next) => {
  res.locals.theme = "/themes/mzui";
  return next();
});
router.get(['/', '/index'], ctrl.index);
module.exports = router;