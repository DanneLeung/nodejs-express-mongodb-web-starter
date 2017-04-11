'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

var router = express.Router();

router
  .get('/', (req, res) => {
    res.render('admin/index');
  });
module.exports = router;