/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var Page = mongoose.model('Page');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Page.find({channel: req.session.channelId}, function (err, pages) {
    if (err) {
      req.flash("error", err);
    }
    res.render('site/page/list', {pages: pages});
  });
};
/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('site/page/form', {page: new Page()});
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Page.findById(id, function (err, page) {
    if (handleErr(req, err))
      res.render('site/page/form', {page: page});
    else
      res.redirect('/page');
  })
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Page.remove({'_id': {$in: ids}}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/page/index');
    }
  });
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.channel = req.session.channelId;
  // handle checkbox unchecked.Å
  if (!req.body.enabled) req.body.enabled = false;

  if (!id) {
    var page = new Page(req.body);
    page.save(function (err, newPage) {
      handleSaved(req, res, err, newPage, 'add');
    });
  } else {
    // update
    Page.findByIdAndUpdate(id, req.body, function (err, page) {
      handleSaved(req, res, err, (err ? req.body : page), 'edit');
    });
  }
};

/**
 * 处理错误，如果没有错误返回true，可以进行下一步，否则返回false
 * @param req
 * @param res
 * @param err
 * @param msg
 */
function handleErr(req, err, msg) {
  if (err) {
    console.log(err);
    req.flash('error', msg ? msg : err);
    return false;
  }
  return true;
}

// handle object saved
function handleSaved(req, res, err, page, type) {
  if (err) {
    console.log(err);
    req.flash('error', '站点保存失败!');
    res.render('site/page/form', {
      viewType: type,
      page: page
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/page/index');
  }
}