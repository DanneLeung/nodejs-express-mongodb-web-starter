/**
 * 微站点模板管理
 */
var mongoose = require('mongoose');
var config = require('../../../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var Template = mongoose.model('Template');

/**
 * 模板列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  var type = req.params.type;
  var query = {};
  if (!type) {
    query.type = type;
  }
  Template.find(query, function (err, templates) {
    if (err) {
      req.flash("error", err);
    }
    res.render('cms/template/list', {
      templates: templates
    });
  });
};
/**
 * 新建模板
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('cms/template/form', {
    template: new Template()
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Template.findById(id, function (err, template) {
    if (handleErr(req, err))
      res.render('cms/template/form', {
        template: template
      });
    else
      res.redirect('/template');
  })
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
    var template = new Template(req.body);
    template.save(function (err, newTemplate) {
      handleSaved(req, res, err, newTemplate, 'add');
    });
  } else {
    // update
    Template.findByIdAndUpdate(id, req.body, function (err, template) {
      handleSaved(req, res, err, (err ? req.body : template), 'edit');
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
function handleSaved(req, res, err, template, type) {
  if (err) {
    console.log(err);
    req.flash('error', '模板保存失败!');
    res.render('cms/template/form', {
      viewType: type,
      template: template
    });
  } else {
    var roleId = req.body.roles;
    console.log("Roles:" + roleId);
    req.flash('success', '模板保存成功!');
    res.redirect('/template');
  }
}
