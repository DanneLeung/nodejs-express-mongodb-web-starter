/**
 * Created by danne on 2016-05-11.
 */
var env = process.env.NODE_ENV || 'development';
var async = require('async');
var mongoose = require('mongoose');
var Wechat = mongoose.model('Wechat');

module.exports = function (app, express) {
  app.use(function (req, res, next) {
    // console.log("********************** initializer....");
    var excludes = ['/api'];
    var url = req.originalUrl;
    // X-Forwarded-Proto 阿里云传递的监听协议header
    var protocol = req.get("X-Forwarded-Proto") || req.protocol || "http";
    // if(protocol == "https")
    // console.log("************************** %s ACCESS!!!", protocol);

    for(var i in excludes) {
      if(url.indexOf(excludes[i]) >= 0)
        return next();
    }

    async.parallel([function (cb) {
      //TODO：wechatId与session里的wid不一致时，需要重新读取wechat
      var wechat = req.session.wechat;
      if(wechat) {
        console.log("*********** found wechat in session wechat name: %s, id: %s. ", req.session.wechat.name, req.session.wechat._id);
        res.locals.appid = wechat.appid;
        if(wechat.oauthWechat) {
          res.locals.authAppid = wechat.oauthWechat.appid; //认证授权使用的appid
          res.locals.authWid = wechat.oauthWechat.id; //认证授权使用的wid
        }
        return cb(null, wechat);
      }
      // 参数中带有wechat id，从wechatid中得到wechat
      Wechat.getDefault(function (err, wechat) {
        if(err) console.error(err);
        if(wechat) {
          req.session.wechat = res.locals.wechat = wechat; //当前使用公众号
          req.session.appid = res.locals.appid = wechat.appid; //当前使用公众号的appid

          if(wechat.oauthWechat) {
            req.session.authAppid = res.locals.authAppid = wechat.oauthWechat.appid; //认证授权使用的appid
            req.session.authWid = res.locals.authWid = wechat.oauthWechat.id; //认证授权使用的wid
          } else {
            req.session.authAppid = res.locals.authAppid = wechat.appid; //认证授权使用的appid
            req.session.authWid = res.locals.authAppid = wechat.id; //认证授权使用的wid
          }
          console.log('****************** 应用运行在公众号', req.originalUrl, JSON.stringify(wechat));
        } else {
          console.warn('***************** 应用运行没有运行在公众号上，可能未配置公众号', wechatId);
          delete req.session.wechat;
          delete req.session.appid;

          delete req.session.authAppid;
          delete req.session.authWid;
        }
        return cb(null, wechat);
      });
    }, function (cb) {
      if(env == 'development') {
        //开发模式时访问本地localhost
        var setting = res.locals.setting = req.session.setting = {};
        res.locals.contextRoot = req.session.contextRoot = '';
        res.locals.contextFront = req.session.contextFront = '/m';
        res.locals.staticRoot = req.session.staticRoot = '';
        res.locals.themeRoot = req.session.themeRoot = req.session.contextRoot + "/themes";
        res.locals.theme = req.session.themeRoot + "/lte";
        res.locals.themeFront = req.session.themeRoot + "/mzui";
        return cb(null, setting);
      } else {
        if(!req.session.setting) {
          mongoose.model('Setting').getAllValues((setting) => {
            // console.log("############# 读取系统参数" + JSON.stringify(setting));
            if(setting) {
              var contextRoot = setting['context.root'] || '';
              var contextFront = setting['context.front'] || '';
              var staticRoot = setting['static.root'] || '';
              //替换protocol
              if(contextRoot) {
                contextRoot = contextRoot.replace("http://", protocol + "://").replace("https://", protocol + "://");
              }
              if(contextFront) {
                contextFront = contextFront.replace("http://", protocol + "://").replace("https://", protocol + "://");
              }
              if(staticRoot) {
                staticRoot = staticRoot.replace("http://", protocol + "://").replace("https://", protocol + "://");
              }

              res.locals.contextRoot = req.session.contextRoot = contextRoot.indexOf('://') ? contextRoot : contextRoot.replace('//', '/');
              res.locals.contextFront = req.session.contextFront = contextFront.indexOf('://') ? contextFront : contextFront.replace('//', '/');
              res.locals.staticRoot = req.session.staticRoot = staticRoot.indexOf('://') ? staticRoot : staticRoot.replace('//', '/');

              var themeRoot = setting['theme.root'] || '/themes';
              var themeFront = setting['theme.front'] || 'mzui';
              if(themeRoot) {
                themeRoot = themeRoot.replace("http://", protocol + "://").replace("https://", protocol + "://");
              }

              res.locals.themeRoot = req.session.themeRoot = themeRoot.indexOf('://') ? themeRoot : themeRoot.replace('//', '/');

              res.locals.theme = req.session.themeRoot + "/lte";
              res.locals.themeFront = req.session.themeRoot + '/' + themeFront;
              res.locals.setting = req.session.setting = setting;
              // console.log('########################## context, front, static, themeRoot ', contextRoot, contextFront, staticRoot, themeRoot);
              return cb(null, setting);
            } else {
              return cb(null, null);
            }
          });
        } else {
          var setting = res.locals.setting = req.session.setting;
          res.locals.contextRoot = req.session.contextRoot = req.session.contextRoot.replace("http://", protocol + "://").replace("https://", protocol + "://");
          res.locals.contextFront = req.session.contextFront = req.session.contextFront.replace("http://", protocol + "://").replace("https://", protocol + "://");
          res.locals.staticRoot = req.session.staticRoot = req.session.staticRoot.replace("http://", protocol + "://").replace("https://", protocol + "://");
          res.locals.themeRoot = req.session.themeRoot = req.session.themeRoot.replace("http://", protocol + "://").replace("https://", protocol + "://");
          res.locals.theme = req.session.themeRoot + "/lte";
          res.locals.themeFront = req.session.themeRoot + "/mzui";
          // console.log('********************** context, front, static, themeRoot in sessions.', req.session.contextRoot, req.session.contextFront, req.session.staticRoot, req.session.themeRoot);
          return cb(null, setting);
        }
      }
    }], function (err, result) {
      // if(result && result.length) console.log('应用当前运行在微信公众号：', result[0]);
      return next();
    });
  });
};