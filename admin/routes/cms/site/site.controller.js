/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var Site = mongoose.model('Site');
var Slide = mongoose.model('Slide');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Site.find({ channel: req.session.channelId }, function (err, sites) {
    if (err) {
      req.flash("error", err);
    }
    res.render('cms/site/list', { sites: sites });
  });
};
/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('cms/site/form', { site: new Site() });
};

exports.edit = function (req, res) {
  var channelId = req.session.channelId;
  var id = req.params.id;
  var q = { _id: id };
  Site.findOne(q).exec(function (err, site) {
    if (handleErr(req, err)) {
      Slide.enabledList(channelId, function (err, slides) {
        console.log("****************** site found: ", site);
        res.render('cms/site/form', { slides: slides, site: site });
      });
    } else {
      res.redirect('/site');
    }
  })
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Site.remove({ '_id': { $in: ids } }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/cms/site/list');
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
    var site = new Site(req.body);
    site.save(function (err, newSite) {
      handleSaved(req, res, err, newSite, 'add');
    });
  } else {
    // update
    Site.findByIdAndUpdate(id, req.body, function (err, site) {
      handleSaved(req, res, err, (err ? req.body : site), 'edit');
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
function handleSaved(req, res, err, site, type) {
  if (err) {
    console.log(err);
    req.flash('error', '站点保存失败!');
    Slide.enabledList(req.session.channelId, function (err, slides) {
      res.render('cms/site/form', {
        viewType: type,
        site: site
      });
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/cms/site/list');
  }
}
