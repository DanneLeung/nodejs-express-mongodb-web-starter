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
var mongoose = require('mongoose');
// var mongoStore = require('connect-mongo')(session);
var RedisStore = require('connect-redis')(session);
var errorHandler = require('errorhandler');
var expressValidator = require('express-validator');
var flash = require('express-flash');
var _ = require('lodash');

var env = process.env.NODE_ENV || 'development';
var views_helpers = require('../../helper/views-helper');
var pkg = require('../../package.json');


module.exports = function (app, express, passport) {
  // settings
  app.set('env', env);
  app.set('port', app.config.server.port || 3000);
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'jade');
  app.enable('trust proxy');
  app.disable('x-powered-by');

  // Express use middlewares
  app.use(favicon(path.join(__dirname, '../../public/favicon.png')));

  // 允许跨域调用
  var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  };
  // app.use(allowCrossDomain);

  //logs
  if (env === 'development') {
    app.use(morgan('dev', {
      skip: function (req, res) {
        return res.statusCode < 400;
      }
    }));
  } else {
    app.use(morgan('combined', {
      skip: function (req, res) {
        return res.statusCode < 400
      },
      stream: require('fs').createWriteStream(app.config.root + '/access.log', { flags: 'a' })
    }))
  }

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(bodyParser.text({ type: 'text/*' }));
  app.use(expressValidator());
  app.use(methodOverride());
  app.use(cookieParser(pkg.name + 'portal'));


  //微信事件推送监听
  //TODO: 使用express 中间件机制拦截处理维系推送消息，而不是全部写死处理，拦截器无法处理是自动传递给最后的默认处理器
  // router.use('/checkWx', function (req, res, nect) {
  //
  // });
  var wechatProcessor = require('../middleware/wechat-processor');
  /**
   * 微信网页授权由于只能配置一个回调域名，因此需要一个统一回掉地址，在根据地址自动重定向到目标地址。
   */
  app.use(wechatProcessor.authRoute);
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
    var Redis = require('ioredis');
    // opts.store = new RedisStore({ client: new Redis.Cluster(app.config.redis.cluster) });
    // opts.store = new RedisStore({ client: new Redis(app.config.redis.single) });
    opts.store = new RedisStore(app.config.redis.single);
  }

  app.use(session(opts));

  // connect flash
  app.use(flash());

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // CSRF
  var csrfExclude = ['/wechat/save'];
  app.use(function (req, res, next) {
    var path = req.path.split('/')[1];
    var ajax = req.params.ajax || req.body.ajax;
    if (/api/i.test(path)) {
      //API json
      return next();
    } else if ("checkWx" == req.path.split('/')[req.path.split('/')
      .length - 1]) {
      // 微信事件推送
      return next();
    } else if (req.header('X-Requested-With') === 'XMLHttpRequest' || ajax) {
      // Ajax post过来的数据
      // console.log("**************** ajax request ,skip csrf");
      return next();
    } else {
      // console.log("**************** csrf protect url ", req.originalUrl);
      //if (_.indexOf(csrfExclude, req.originalUrl) >= 0) return next();
      // csrf(req, res, next);
      next();
    }
  });

  //compression
  app.use(compression({
    filter: function (req, res) {
      return /json|text|javascript|css/.test(res.get('Content-Type'))
    },
    level: 9
  }));

  // view helper
  app.use(views_helpers(app.config.app.name));

  // another view helper functions.
  app.use(function (req, res, next) {
    res.locals.pkg = pkg;
    res.locals.NODE_ENV = env;
    //res.locals.moment = require('moment');
    if (_.isObject(req.user)) {
      res.locals.User = req.user
    }
    next();
  });

  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(responseTime());
  }

  // static content
  app.use(express.static(path.normalize(__dirname + '/../../public', {
    maxAge: 3600
  })));

  app.use('/', require('./initializer'));
  //
  require('./template')();

  // Routers
  var routers_path = __dirname + '/../routes';
  fs.readdirSync(routers_path)
    .forEach(function (file) {
      var rn = file.substr(0, file.length - 3);
      //console.log("router name: " + rn);
      if (~file.indexOf('.js')) {
        if (file != 'index.js') {
          app.use('/' + rn, require(routers_path + '/' + file));
        }
      }
    });

  //index路由放到最后
  app.use('/', require(routers_path + '/index'));

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
    res.type('txt')
      .send('Not found');
  });

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
        res.type('txt')
          .send(message + '\n');
      }
    });
  }
};
