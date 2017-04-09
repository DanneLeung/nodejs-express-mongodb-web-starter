"use strict";

var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var Auth = require(config.root + '/middleware/authorization');

// Routers
// set global variables in locals.
router.use((req, res, next) => {
  res.locals.theme = "/themes/lte";
  res.locals.themeRoot = "/themes";
  var url = req.contextRoot + req.baseUrl;
  if (url.indexOf('http') < 0) {
    url = url.replace('//', '/');
  }
  req.absBaseUrl = url;
  return next();
});
// load activities modules
var modulePath = __dirname;
fs.readdirSync(modulePath).forEach(function (file) {
  var index = false;
  if(file.indexOf('.') < 0) {
    var module = './' + file;
    var p = "/";
    if(!('index' == file || 'home' == file)) {
      p = p + file;
    } else {
      index = true;
    }
    console.log("**** routes " + p + " to " + module);
    // module routes
    if(index) {
      router.use(p, require(module));
    } else {
      router.use(p, Auth.requiresLogin, require(module));
    }
    // module static contents
    router.use(p, express.static(path.join(__dirname, module, '/static')));
  }
});

module.exports = router;