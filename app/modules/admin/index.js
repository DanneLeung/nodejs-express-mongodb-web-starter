"use strict";

var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var config = require('../../../config/config');
var Auth = require(config.root + '/middleware/authorization');

router.use(Auth.requiresLogin);

router.use((req, res, next) => {
  res._redirect = res.redirect;
  res.redirect = function (uri) {
    var url = _.startsWith(uri, 'http') ? uri : req.session.contextRoot || "" + uri;
    console.log(" >>>>>>>>>>>>>>>>>.. redirect to ", url);
    res._redirect(url);
  };
  next();
});

// Routers
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