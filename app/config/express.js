"use strict";
var fs = require('fs');
var morgan = require('morgan');
var path = require('path');
var responseTime = require('response-time');
var methodOverride = require('method-override');
var compression = require('compression');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var csrf = require('lusca').csrf();
var mongoStore = require('connect-mongo')({session: session});

var expressValidator = require('express-validator');
var env = process.env.NODE_ENV || 'development';
var views_helpers = require('../../helper/views-helper');
var pkg = require('../../package.json');
var flash = require('express-flash');
var _ = require('lodash');


module.exports = function (app, express, passport) {
  // settings
  app.set('env', env);
  app.set('port', app.config.server.port || 3000);
  app.set('views', path.join(__dirname, '/../' + '/views'));
  app.set('view engine', 'jade');
  app.enable('trust proxy');
  app.disable('x-powered-by');

  // Express use middlewares
  app.use(favicon(path.join(app.config.root + '/public/favicon.png')));
  //app.use(allowCrossDomain);
  if (env === 'development') {
    app.use(morgan('dev', {
      skip: function (req, res) {
        return res.statusCode < 400;
      }
    }))
  } else {
    app.use(morgan('combined', {
      skip: function (req, res) {
        return res.statusCode < 400
      },
      stream: require('fs').createWriteStream(app.config.root + '/access.log', {flags: 'a'})
    }))
  }

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(bodyParser.text({type: 'text/*'}));
  app.use(expressValidator());
  app.use(methodOverride());
  app.use(cookieParser('notagoodsecretnoreallydontusethisone'));

  app.use('/api', require('../api'));

  //session store
  app.use(session({
    name: [pkg.name, 'front', '.sid'].join(),
    httpOnly: true,
    proxy: true,
    resave: true,
    saveUninitialized: true,
    secret: pkg.name + 'front',
    unset: 'keep',
    cookie: {
      maxAge: 3600 * 1000
    },
    // genid: function (req) {
    //   return require('node-uuid').v4(); // use UUIDs for session IDs
    // },
    store: new mongoStore({
      url: app.config.database.url,
      collection: 'sessions'
    })
  }));

  // connect flash
  app.use(flash());
  // use passport session
  app.use(passport.initialize());
  app.use(passport.session({
    // maxAge: new Date(Date.now() + 3600000)
  }));

  // CSRF
  var csrfExclude = ['/'];
  app.use(function (req, res, next) {
    var path = req.path.split('/')[1];
    var ajax = req.params.ajax || req.param.ajax || req.body.ajax;
    if (/api/i.test(path)) {
      return next();
    } else if (req.header('X-Requested-With') === 'XMLHttpRequest' || ajax) {
      console.log("ajax request ,skip csrf");
      return next();
    } else {
      // if (_.indexOf(csrfExclude, req.originalUrl) >= 0) return next();
      // csrf(req, res, next);
      next();
    }
  });

  //compression
  app.use(compression({
    filter: function (req, res) {
      return /json|text|javascript|css/.test(res.getHeader('Content-Type'))
    },
    level: 9
  }));

  // view helper
  app.use(views_helpers(app.config.app.name));

  app.use(function (req, res, next) {
    res.locals.pkg = pkg;
    res.locals.NODE_ENV = env;
    res.locals.moment = require('moment');
    if (_.isObject(req.user)) {
      res.locals.User = req.user
    }
    next();
  });

  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(responseTime());
  } else {
  }

  // static content
  app.use(express.static(path.normalize(app.config.root + '/public', {maxAge: 3600})));

};
