/**
 * Module dependencies.
 */
"use strict";

var _ = require('lodash'),
  url = require('url'),
  qs = require('querystring'),
  moment = require('moment');

/**
 * Helpers method
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function helpers(name) {
  return function (req, res, next) {
    res.locals.appName = name;
    res.locals.req = req;
    res.locals.isActive = function (link) {
      //console.log("####### origin url: " + req.originalUrl + ", link: " + link);
      return req.originalUrl.indexOf(link) !== -1 ? 'active' : '';
    };
    res.locals.formatDate = formatDate;
    res.locals.formatDatetime = formatDatetime;
    res.locals.paddingLeft = paddingLeft;
    res.locals.stripScript = stripScript;
    res.locals.createPagination = createPagination(req);

    if(typeof req.flash !== 'undefined') {
      // res.locals.info = req.flash('info');
      // res.locals.errors = req.flash('error');
      // res.locals.success = req.flash('success');
      // res.locals.warning = req.flash('warning');
      // console.log("********************* req flash success ", JSON.stringify(res.locals.success), res.get('Content-Type'));
    }

    /**
     * Render mobile views
     *
     * If the request is coming from a mobile/tablet device, it will check if
     * there is a .mobile.ext file and it that exists it tries to render it.
     *
     * Refer https://github.com/madhums/nodejs-express-mongoose-demo/issues/39
     * For the implementation refer the above app
     */
    // For backward compatibility check if `app` param has been passed
    var ua = req.header('user-agent');
    var fs = require('fs');

    res._render = res.render;
    req.isMobile = /mobile/i.test(ua);

    res.render = function (template, locals, cb) {
      var view = template + '.mobile.' + req.app.get('view engine');
      var file = req.app.get('views') + '/' + view;

      if(/mobile/i.test(ua) && fs.existsSync(file)) {
        res._render(view, locals, cb);
      } else {
        res._render(template, locals, cb);
      }
    };
    res._redirect = res.redirect;
    res.redirect = function (uri) {
      var url = _.startsWith(uri, 'http') ? uri : ((req.session.contextRoot || "") + uri);
      console.log(" >>>>>>>>>>>>>>>>>.. redirect to ", url);
      res._redirect(url);
    };
    next();
  };
}

module.exports = helpers;

/**
 * Pagination helper
 *
 * @param {Number} pages
 * @param {Number} page
 * @return {String}
 * @api private
 */
function createPagination(req) {
  return function createPagination(pages, page) {
    var params = qs.parse(url.parse(req.url).query);
    var str = '';
    params.page = 1;
    var clas = page == 1 ? "active" : "no";
    for(var p = 1; p <= pages; p++) {
      params.page = p;
      clas = page == p ? "active" : "no";
      var href = '?' + qs.stringify(params);
      str += '<li class="' + clas + '"><a href="' + href + '">' + p + '</a></li>';
    }
    return str;
  };
}

/**
 * Format date helper
 *
 * @param {Date} date
 * @return {String}
 * @api private
 */

function formatDate(date) {
  date = new Date(date);
  return moment(date).format('YY-M-D');
}

/**
 * Format date time helper
 *
 * @param {Date} date
 * @return {String}
 * @api private
 */

function formatDatetime(date) {
  if(!date || date == 'undefined') {
    return "";
  }
  date = new Date(date);
  return moment(date).format('YY-M-D HH:mm');
  //return formatDate(date) + ' ' + hour + ':' + minutes;
}

/**
 *
 * @param str
 * @param char
 * @param len
 * @returns {string}
 */
function paddingLeft(str, char, len) {
  var s = " ";
  while(len > 0) {
    s = s + char;
    len--;
  }
  return s + str;
}

/**
 * Strip script tags
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function stripScript(str) {
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}