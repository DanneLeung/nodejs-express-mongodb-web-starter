/**
 * Created by xingjie201 on 2016/3/18.
 */
'use strict';
var mongoose = require('mongoose');
//var Page = mongoose.model('Page');
var Page = mongoose.model('LinkProductSite');
var LinkProductRelease = mongoose.model('LinkProductRelease');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');
var async = require('async');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');


exports.index = function (req, res) {
  res.render('shop/product/page/list');
};


exports.add = function (req, res) {
  LinkProductRelease.find({
    channel: req.session.channelId,
    published: true
  }, function(err, release) {
    if(!err && release) {
      res.render('shop/product/page/form', {page: new Page(), noChecked: release});
    }else {
      res.render('shop/product/page/form', {page: new Page(), noChecked: null});
    }
  });

};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Page.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/product/page/list');
    }
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  async.waterfall([function(cb) {
    LinkProductRelease.find({
      channel: req.session.channelId,
      published: true
    }, function(err, release) {
      if(err) {
        return cb(null, null);
      }
      return cb(null, release);
    });
  }, function(release, cb) {

    Page.findOne({_id: id}).populate('releases').exec(function(err, result) {
      //console.log('--------------------------result.releases',result.releases.length);
      if (err) {
        return cb('页面不存在', null);
      } else {
        if(!result) {
          return cb('该页面设置错误，请删除后重新添加', null);
        }
        var checkedIds = [], noChecked = [];
        if(result.releases && result.releases.length > 0) {
          for(var i=0; i<result.releases.length; i++) {
            checkedIds.push(result.releases[i]._id.toString());
          }
        }
        if(release) {
          //是否选中
          release.forEach(function(r) {
            //找出没选中得
            var rid = r._id.toString();
            if(checkedIds.indexOf(r._id.toString()) < 0) {
              noChecked.push({_id: r._id, title: r.title});
            }
          });
          console.log('----------------------------noChecked',noChecked);
          return cb(null, {page: result,noChecked: noChecked, release: result.releases});
        } else {
          return cb(null, {page: result, release: result.releases, noChecked: noChecked});
        }
      }
    });
  }], function(err, results) {
    if(err) {
      req.flash('error', err);
      return res.redirect('/shop/product/page/list');
    }
    res.render('shop/product/page/form', {page: results.page,noChecked: results.noChecked, release: results.release});
  })
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.online = typeof req.body.online !== 'undefined' && req.body.online == 'on' ? true : false;
  //处理发布的商品
  var releases = typeof req.body.release !== 'undefined' && req.body.release ? req.body.release.split(',') : [];

  function saveOrUpdate(id, req, res) {
    req.body.releases = releases;
    req.body.channel = req.session.channelId;
    if (!id) {
      var page = new Page(req.body);
      page.save(function (err, result) {
        handleSaved(req, res, err, result);
      });
    } else {
      // update
      req.body.releases = releases;
      Page.findByIdAndUpdate(id, req.body, function (err, result) {
        handleSaved(req, res, err, req.body);
      });
    }
  }

  //handle error
  function handleSaved(req, res, err, page) {
    if (err) {
      req.flash('error', '保存失败!');
      res.render('shop/product/page/form', {
        page: page == null ? new Page() : page
      });
    } else {
      req.flash('success', '保存成功!');
      res.redirect('/shop/product/link/site');
    }
  }

  var slides = [];
  if(typeof req.body.num !== 'undefined'){
    if(req.body.num.length == 1) {
      slides.push({
        title: req.body.slidesitle,
        imageUrl: req.body.imageUrl,
        link: req.body.link
      });
    }
    if(req.body.num.length > 1) {
      req.body.num.forEach(function(n, i) {
        slides.push({
          title: req.body.slidesitle[i],
          imageUrl: req.body.imageUrl[i],
          link: req.body.link[i]
        });
      });
    }
  }
  req.body.slides = slides;
  saveOrUpdate(id, req, res);
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
    res.render('shop/product/page/form', {
      viewType: type,
      page: page
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/shop/product/page/list');
  }
}
/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {

  Page.dataTable(req.query, {conditions: {channel: req.session.channelId}}, function (err, data) {
    res.send(data);
  });
};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var name = req.query.name;
  var oldName = req.query.oldName;
  if (name === oldName) {
    res.send('true');
  } else {
    Page.count({'name': name, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 获取页面数据
 * @param req
 * @param res
 */
exports.getPages = function(req,res){
  Page.find({channel:req.session.channelId},function(err,pages){
    res.send(pages);
  });
}




