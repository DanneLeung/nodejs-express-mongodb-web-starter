/**
 * 轮播管理
 */
var mongoose = require('mongoose');
var config = require('../../../../../config/config');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');

var Category = mongoose.model('CmsCategory');

/**
 * 轮播列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Category.find({  }).sort('lineage').exec(function (err, categories) {
    if(err) {
      req.flash("error", err);
    }
    res.render('cms/category/list', { categories: categories ? [] : categories });
  });
};
/**
 * 新建轮播
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  var id = req.params.id;
  if(id) {
    Category.findOne({
      _id: id
    }, (err, category) => {
      if(!err && category) {
        res.render('cms/category/form', { category: new Category(), parent: category });
      } else {
        res.render('cms/category/form', { category: new Category(), categories: [] });
      }
    })
  } else {
    Category.find({
      parent: null,
      enabled: true
    }, function (err, categories) {
      res.render('cms/category/form', { category: new Category(), categories: categories });
    });
  }
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Category.findById(id).populate('parent').exec(function (err, category) {
    console.log("*************** Category found: ", category);
    if(handleErr(req, err)) {
      if(category.depth && category.depth > 1) {
        Category.find({
          enabled: true,
          parent: category.parent.parent
        }, function (e, categories) {
          res.render('cms/category/form', { category: category, categories: categories });
        })
      } else {
        res.render('cms/category/form', { category: category, categories: [] });
      }
    } else
      res.redirect('/cms/category');
  });

};

exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Category.findById(id, function (err, category) {
    if(!err) {
      updata.enabled = category.enabled = !category.enabled;
      msg = category.enabled ? "激活成功!" : "禁用成功!";
      Category.update({ '_id': id }, updata, options, function (err, category) {
        if(handleErr(req, err)) {
          res.redirect('/cms/category');
        } else {
          req.flash('success', msg);
          res.redirect('/cms/category');
        }
      });

    } else {
      res.redirect('/cms/category');
    }
  });
};
/**
 * 获取文章列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Category.dataTable(req.query, { conditions: {} }, function (err, data) {
    res.send(data);
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Category.remove({ '_id': { $in: ids } }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/cms/category/list');
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
  // handle checkbox unchecked.
  if(!req.body.enabled) req.body.enabled = false;

  if(!id) {
    var category = new Category(req.body);
    category.save(function (err, newCategory) {
      handleSaved(req, res, err, newCategory, 'add');
    });
  } else {
    // update
    if(!req.body.parent) {
      req.body.depth = 1;
      req.body.parent = null;
    }
    Category.findByIdAndUpdate(id, req.body, function (err, Category) {
      handleSaved(req, res, err, (err ? req.body : Category), 'edit');
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
  if(err) {
    console.log(err);
    req.flash('error', msg ? msg : err);
    return false;
  }
  return true;
}

// handle object saved
function handleSaved(req, res, err, Category, type) {
  if(err) {
    console.log(err);
    req.flash('error', '轮播保存失败!');
    res.render('cms/category/form', {
      viewType: type,
      Category: Category
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '轮播保存成功!');
    res.redirect('/cms/category');
  }
}