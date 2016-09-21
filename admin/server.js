"use strict";
var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require(__dirname + '/../config/config');

var app = express();

if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  //app.use(require('express-enforces-ssl')());
}

app.config = config;

// Database
require('../config/database')(app.config.database.url, mongoose);

// Init datatable
var dataTable = require('mongoose-datatable');
dataTable.configure({ verbose: false, debug: false });
mongoose.plugin(dataTable.init);

// Models
var models_path = __dirname + '/../models';
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file);
});


// Passports
require('./config/passport')(app, passport);
// Express settings
require('./config/express')(app, express, passport);

var server = require('http').createServer(app);
//
// var socketio = require('socket.io')(server, {
//   serveClient: config.env !== 'production',
//   path: '/socket.io-client'
// });

// require('./config/socketio')(socketio);

// create a server instance passing in express app as a request event handler
server.listen(app.get('port'), function () {
  console.log("\n✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;
