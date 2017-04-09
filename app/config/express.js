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
var mongoStore = require('connect-mongo')({
  session: session
});

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
      stream: require('fs').createWriteStream(app.config.root + '/access.log', {
        flags: 'a'
      })
    }))
  }

  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.text({
    type: 'text/*'
  }));
  app.use(expressValidator());
  app.use(methodOverride());
  app.use(cookieParser(pkg.name + 'app'));

  app.use('/api', require('../api'));

  //微信事件推送监听
  //TODO: 使用express 中间件机制拦截处理维系推送消息，而不是全部写死处理，拦截器无法处理是自动传递给最后的默认处理器
  // router.use('/checkWx', function (req, res, nect) {
  //
  // });
  var wechatProcessor = require('../middleware/wechat-processor');
  app.get("/checkWx", wechatProcessor.checkWxg) //服务器验证
    .post("/checkWx", wechatProcessor.checkWxp); //微信推送默认处理

  //session store
  var opts = {
    name: [pkg.name, 'portal', '.sid'].join(),
    proxy: true,
    resave: true,
    saveUninitialized: true,
    secret: pkg.name + 'portal',
    unset: 'destroy',
    cookie: {
      maxAge: 3600 * 1000
    }
  };

  if (env === 'production') {
    if ("cluster" === app.config.redis.mode)
      app.redis = new Redis.Cluster(app.config.redis.cluster);
    else
      app.redis = new Redis(app.config.redis.single);
    opts.store = new RedisStore({
      client: app.redis
    });
  } else {
    // opts.store = new RedisStore({ client: app.redis });
  }

  app.use(session(opts));

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
  } else {}

  // static content
  app.use(express.static(path.normalize(app.config.root + '/public', {
    maxAge: 3600
  })));

};
