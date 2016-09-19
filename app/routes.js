/**
 * Main application routes
 */

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');

var env = process.env.NODE_ENV || 'development';
var errors = require('./components/errors');
var errorHandler = require('errorhandler');
module.exports = function (app, express) {
  //拦截未授权给渠道的页面访问
  app.use(function (req, res, next) {

    next();

  });

  // load modules
  var modulePath = __dirname + '/' + 'modules';
  fs.readdirSync(modulePath).forEach(function (file) {
    if (file.indexOf('.') < 0) {
      var module = "./modules/" + file;
      var p = "/";
      if (!('index' == file || 'home' == file)) {
        p = p + file;
      }
      console.log("**** routes " + p + " to " + module);
      // module static contents
      app.use(p, express.static(__dirname + '/' + module + '/static'));
      // module routes
      app.use(p, require(module));
    }
  });

  // All undefined asset or api routes should return a 404
  //app.route('/:url(api|auth|components|app|bower_components|assets)/*')
  //  .get(errors[404]);

  //404
  app.use(function handleNotFound(req, res, next) {
    res.status(404);
    if (req.accepts('html')) {
      res.render('404', {
        url: req.url,
        error: '404 Not found'
      });
      return;
    }
    if (req.accepts('json')) {
      res.send({
        error: 'Not found'
      });
      return;
    }
    res.type('txt').send('Not found');
  });

  //Errors
  if (env === 'development') {
    app.use(errorHandler());
  } else {
    app.use(function logErrors(err, req, res, next) {
      if (err.status === 404) {
        return next(err)
      }
      console.error(err.stack);
      next(err)
    });

    app.use(function respondError(err, req, res, next) {
      var status, message;
      console.error("Response Error ... \n" + err.stack);
      status = err.status || 500;
      res.status(status);
      message = ((err.productionMessage && err.message) || err.customProductionMessage);
      if (!message) {
        if (status === 403) {
          message = '权限不足，无法访问该页面';
        } else {
          message = '系统错误，请联系管理员';
        }
      }

      if (req.accepts('json')) {
        res.send({
          error: message
        });
      } else {
        res.render('' + status, {error: err, message: message});
      }
    });
  }
};
