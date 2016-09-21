/**
 * 商城后台管理模块
 */

"use strict";

var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var passport = require('passport');
var Auth = require(config.root + '/middleware/authorization');
var fs = require('fs');

// Routers
router.use(Auth.requiresLogin);
// load activities modules
var modulePath = __dirname + '/' + 'shop';
fs.readdirSync(modulePath).forEach(function (file) {
  if (file.indexOf('.') < 0) {
    var module = "./shop/" + file;
    var p = "/";
    if (!('index' == file || 'home' == file)) {
      p = p + file;
    }
    console.log("**** routes " + p + " to " + module);
    // module routes
    router.use(p, require(module));
    // module static contents
    router.use(p, express.static(__dirname + '/' + module + '/static'));
  }
});

module.exports = router;
