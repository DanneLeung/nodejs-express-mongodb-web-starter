/**
 * 轮播管理
 */
var mongoose = require('mongoose');
var config = require('../../../../config/config');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');

var Slide = mongoose.model('Slide');

/**
 * 轮播列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Slide.find({ channel: req.session.channelId }, function (err, slides) {
    if(err) {
      req.flash("error", err);
    }
    res.render('cms/slide/list', { slides: slides ? [] : slides });
  });
};
/**
 * 新建轮播
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('cms/slide/form', { slide: new Slide() });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Slide.findById(id, function (err, slide) {
    console.log("*************** Slide found: ", slide);
    if(handleErr(req, err))
      res.render('cms/slide/form', { slide: slide });
    else
      res.redirect('/cms/slide');
  });
};

exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Slide.findById(id, function (err, slide) {
    if(!err) {
      updata.enabled = slide.enabled = !slide.enabled;
      msg = slide.enabled ? "激活成功!" : "禁用成功!";
      Slide.update({ '_id': id }, updata, options, function (err, slide) {
        if(handleErr(req, err)) {
          res.redirect('/cms/slide');
        } else {
          req.flash('success', msg);
          res.redirect('/cms/slide');
        }
      });

    } else {
      res.redirect('/cms/slide');
    }
  });
};
/**
 * 获取文章列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Slide.dataTable(req.query, { conditions: { 'channel': req.session.channel._id } }, function (err, data) {
    res.send(data);
  });
};
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Slide.remove({ '_id': { $in: ids } }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/cms/slide/list');
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
  // handle checkbox unchecked.
  if(!req.body.enabled) req.body.enabled = false;

  // handle images
  var urls = req.body.url;
  var titles = req.body.title;
  var links = req.body.link;
  var images = [];
  if(urls && _.isArray(urls)) {
    for(var i = 0; i < urls.length; i++) {
      images.push({
        title: (titles && titles.length > i) ? titles[i] : "", //图片标题
        url: urls[i], //图片远程url，引用外部图片时直接完整URL
        link: (links && links.length > i) ? links[i] : "", //图片点击链接
        sort: i //排序，也可以按照数组顺序
      });
    }
  } else if(urls) {
    images.push({
      title: titles, //图片标题
      url: urls, //图片远程url，引用外部图片时直接完整URL
      link: links, //图片点击链接
      sort: 0 //排序，也可以按照数组顺序
    });
  }
  req.body.images = images;

  if(!id) {
    var slide = new Slide(req.body);
    slide.save(function (err, newSlide) {
      handleSaved(req, res, err, newSlide, 'add');
    });
  } else {
    // update
    Slide.findByIdAndUpdate(id, req.body, function (err, Slide) {
      handleSaved(req, res, err, (err ? req.body : Slide), 'edit');
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
function handleSaved(req, res, err, Slide, type) {
  if(err) {
    console.log(err);
    req.flash('error', '轮播保存失败!');
    res.render('cms/slide/form', {
      viewType: type,
      Slide: Slide
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '轮播保存成功!');
    res.redirect('/cms/slide');
  }
}