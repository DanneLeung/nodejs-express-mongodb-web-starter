"use strict";
/**
 * Created by danne on 2016-05-11.
 */
var env = process.env.NODE_ENV || 'development';
var async = require('async');
var mongoose = require('mongoose');
var Menu = mongoose.model('Menu');
var Setting = mongoose.model('Setting');
var _ = require('lodash');

exports = module.exports = function (req, res, next) {
  var findMenu = function (menus, lineage, depth) {
    if (!depth) depth = 1;
    if (menus) {
      for (var i in menus) {
        var m = menus[i];
        if (m.depth >= depth && _.startsWith(lineage, m.lineage)) {
          // console.log("******************* menu found: ", m);
          return m;
        }
        if (m.children && m.children.length) {
          var v = findMenu(m.children, lineage);
          if (v) return v;
        }
      }
    }
    return null;
  }
  res.locals.findMenu = findMenu;

  var currentMenu = function (cb) {
    // console.log("**************** original url: %s, req is: %s.", req.originalUrl, req.is('json'));

    var link = req.originalUrl;
    //如果有.符号，非html页面
    if (link.indexOf('.') > 0 || (req.header('X-Requested-With') === 'XMLHttpRequest')) {
      return cb(null, null);
    }
    //去除QueryString
    if (link.indexOf('?') > 0) {
      link = link.substr(0, link.indexOf('?'));
    }
    // 根据url查找对应menu
    Menu.findByLink(link, function (m) {
      // console.log('**************** current menu link ', link, m);
      cb(null, m);
    });
  };
  var loadMenu = function (cb) {
    //加载菜单
    var menus = req.session.menus;
    if (!menus) {
      //console.log("*************** channel menus ", chMenus);
      Menu.findOne({ code: 'root' }).exec(function (err, ms) {
        if (err) console.error(err);
        console.log("*********** loading Menu >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", JSON.stringify(ms));
        // console.log(ms);
        cb(null, ms.children);
      });
    } else {
      cb(null, menus);
    }
  };
  var loadSetting = function (cb) {
    var setting = req.session.setting;
    //console.log("*********** initializing data: " + JSON.stringify(setting));
    if (!setting) {
      Setting.getAllValues(function (settings) {
        req.session.setting = setting;
        cb(null, settings)
      });
    } else {
      cb(null, setting);
    }
  };
  async.parallel({
    // currentMenu: currentMenu,
    menus: loadMenu,
    setting: loadSetting
  }, function (err, result) {
    //console.log("*********** initializing data: " + JSON.stringify(result));
    if (result) {
      // if (result.currentMenu) {
      //   req.session.currentMenu = res.locals.currentMenu = result.currentMenu;
      // } else {
      //   res.locals.currentMenu = req.session.currentMenu;
      // }
      req.session.menus = result.menus;
      req.session.setting = res.locals.setting = result.setting;
      var contextRoot = result.setting['context.root'];
      contextRoot = (contextRoot ? contextRoot : '');
      contextRoot = contextRoot + (_.endsWith(contextRoot, '/') ? '' : '/');
      req.session.contextRoot = res.locals.contextRoot = contextRoot;

      var contextFront = result.setting['context.front'];
      req.session.contextFront = res.locals.contextFront = contextFront ? contextFront : '';

      var staticRoot = result.setting['static.root'];
      req.session.staticRoot = res.locals.staticRoot = staticRoot ? staticRoot.trim() : '';

      var themeRoot = result.setting['theme.root'];
      res.locals.themeRoot = themeRoot ? themeRoot : '';

      var theme = result.setting['theme.default'];
      req.session.theme = res.locals.theme = themeRoot + "/" + (theme ? theme : "default");

    }
    //开发环境中使用固定配置
    if (env == 'development') {
      req.session.contextRoot = res.locals.contextRoot = '/';
      req.session.contextFront = res.locals.contextFront = '';
      req.session.staticRoot = res.locals.staticRoot = '';
      req.session.themeRoot = res.locals.themeRoot = "/themes";
      req.session.theme = res.locals.theme = req.session.themeRoot + "/default";
      //next();
    }
    // convert uploaded file path to url.
    res.locals.url = function (file) {
      var url = req.session.staticRoot + file;
      console.log("************* file to url " + url);
      return url.indexOf('://') >= 0 ? url : url.replace('//', '/');
    };
    return next();
  });
};
