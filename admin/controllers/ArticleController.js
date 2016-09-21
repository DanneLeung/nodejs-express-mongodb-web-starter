/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var Article = mongoose.model('Content');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Article.find({channel: req.session.channelId}, function (err, articles) {
    if (err) {
      req.flash("error", err);
    }
    res.render('site/article/list', {articles: articles});
  });
};
/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('site/article/form', {article: new Article()});
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Article.findById(id, function (err, article) {
    console.log("*************** article found: ", article);
    if (handleErr(req, err))
      res.render('site/article/form', {article: article});
    else
      res.redirect('/article');
  })
};
/**
 * 获取文章列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Article.dataTable(req.query, {conditions: {'channel': req.session.channel._id}}, function (err, data) {
    res.send(data);
  });
}
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Article.remove({'_id': {$in: ids}}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/article/index');
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
    var article = new Article(req.body);
    article.save(function (err, newArticle) {
      handleSaved(req, res, err, newArticle, 'add');
    });
  } else {
    // update
    Article.findByIdAndUpdate(id, req.body, function (err, article) {
      handleSaved(req, res, err, (err ? req.body : article), 'edit');
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
function handleSaved(req, res, err, article, type) {
  if (err) {
    console.log(err);
    req.flash('error', '站点保存失败!');
    res.render('site/article/form', {
      viewType: type,
      article: article
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/site/article');
  }
}