"use strict";
var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require(__dirname + '/../config/config');

var app = express();
app.appName = 'admin';

if(process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  //app.use(require('express-enforces-ssl')());
}

app.config = config;

// Database
require('../config/database')(app.config.database.url, mongoose);

// init datatable
var dataTable = require('mongoose-datatable');
dataTable.configure({ verbose: false, debug: false });
mongoose.plugin(dataTable.init);

// Models
require('../models');

// Passports
require('./config/passport')(app, passport);

// Express settings
require('./config/express')(app, express, passport);
// app initializer middleware
require('./config/initializer')(app, express);
// Routes
require('./routes')(app, express);

// create a server instance
// passing in express app as a request event handler
app.listen(app.get('port'), function () {
  console.log("\n✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;