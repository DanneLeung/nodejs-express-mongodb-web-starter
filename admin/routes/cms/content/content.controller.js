/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../../../config/config');
var moment = require('moment');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;


var Category = mongoose.model('CmsCategory');
var Content = mongoose.model('Content');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Content.find({ channel: req.session.channelId }, function (err, contents) {
    if (err) {
      req.flash("error", err);
    }
    res.render('cms/content/list', { contents: contents ? [] : contents });
  });
};
/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  
  res.render('cms/content/form', { content: new Content() });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Content.findById(id, function (err, content) {
    // console.log("*************** content found: ", content);
    if (handleErr(req, err))
      res.render('cms/content/form', { content: content });
    else
      res.redirect('/content');
  })
};
/**
 * 获取文章列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Content.dataTable(req.query, { conditions: { 'channel': req.session.channel._id } }, function (err, data) {
    res.send(data);
  });
}
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Content.remove({ '_id': { $in: ids } }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/content/index');
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
    var content = new Content(req.body);
    content.save(function (err, newContent) {
      handleSaved(req, res, err, newContent, 'add');
    });
  } else {
    // update
    Content.findByIdAndUpdate(id, req.body, function (err, content) {
      handleSaved(req, res, err, (err ? req.body : content), 'edit');
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
function handleSaved(req, res, err, content, type) {
  if (err) {
    console.log(err);
    req.flash('error', '站点保存失败!');
    res.render('cms/content/form', {
      viewType: type,
      content: content
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/cms/content');
  }
}