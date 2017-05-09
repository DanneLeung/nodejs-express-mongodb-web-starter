/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../../../../config/config');
var moment = require('moment');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;
var fileUtl = require(config.root + '/util/file');
var imgUtil = require(config.root + '/util/imgutil');

var Category = mongoose.model('CmsCategory');
var Content = mongoose.model('Content');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Content.find({  trashed: false}, function (err, contents) {
    if(err) {
      req.flash("error", err);
    }
    res.render('cms/content/list', { contents: contents ? [] : contents });
  });
};

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.trash = function (req, res) {
  res.render('cms/content/trashList');
};
/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  Category.find({  enabled: true }).sort('lineage').exec(function (err, categories) {
    res.render('cms/content/form', { content: new Content(), categories: categories });
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Category.find({  enabled: true }).sort('lineage').exec(function (err, categories) {
    console.log('=============categories',categories);
    Content.findById(id, function (err, content) {
      // console.log("*************** content found: ", content);
      if(handleErr(req, err))
        res.render('cms/content/form', { content: content, categories: categories });
      else
        res.redirect('/content');
    });
  })
};

exports.publish = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Content.findById(id, function (err, content) {
    if(!err) {
      updata.published = content.published = !content.published;
      msg = content.published ? "发布成功!" : "发布撤回成功!";
      if(!content.publishedAt && content.published) {
        updata.publishedAt = new Date();
      }
      Content.update({ '_id': id }, updata, options, function (err, content) {
        if(handleErr(req, err)) {
          req.flash('success', msg);
          res.redirect('/cms/content/list');
        } else {
          res.redirect('/cms/content/list');
        }
      });

    } else {
      res.redirect('/cms/content/list');
    }
  });
};

/**
 * 获取文章列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Content.dataTable(req.query, { conditions: { trashed: false } }, function (err, data) {
    res.send(data);
  });
};

/**
 * 获取文章列表
 * @param req
 * @param res
 */
exports.trashDatatable = function (req, res) {
  Content.dataTable(req.query, { conditions: { trashed: true } }, function (err, data) {
    res.send(data);
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  var type = req.body.type;

  if(type == 'del') {
    Content.remove({ '_id': { $in: ids } }, function (err, result) {
      if(err) {
        console.log(err);
        req.flash('error', err);
      } else {
        req.flash('success', '数据删除成功!');        
      }
      res.redirect('/cms/content/list');
    });
  }
  if(type == 'trash') {
    Content.update({
      '_id': { $in: ids }
    }, {
      $set: {
        trashed: true
      }
    }, { multi: true }, (err, result) => {
      if(err || !result || !result.nModified) {
        req.flash('error', '数据扔进回收站失败');
      } else {
        req.flash('success', '数据已扔进回收站!');       
      }
      res.redirect('/cms/content/list');
    });
  }
  
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  // handle checkbox unchecked.Å
  if(!req.body.published) {
    req.body.published = false;
  } else {
    req.body.publishedAt = new Date();
  }


  if (req.body.time) {
    var times = req.body.time.split(' - ');
    console.log("$$$$$$$$$$$$ 活动时间：" + times);
    if (times.length > 1) {
      req.body.startTime = moment(times[0]);
      req.body.endTime = moment(times[1]);
    }
  } else {
    req.body.startTime = null;
    req.body.endTime = null;
  }

  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req.body);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'sms', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      for (i in fs) {
        fs[i].width = fs[i].height = 640;
      }
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.saveFiles(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if (files && files.length > 0) {
            console.log(files[0]);
            for (var i = 0; i < files.length; i++) {
              var fieldname = files[i].fieldname;
              req.body[fieldname] = files[i].thumb;
            }
          }
          saveOrUpdate(id, req.body);
        });
      });
    });
  }

  function saveOrUpdate(id, data) {
    if(!id) {
      var content = new Content(data);
      content.save(function (err, newContent) {
        handleSaved(req, res, err, newContent, 'add');
      });
    } else {
      // update
      Content.findByIdAndUpdate(id, req.body, function (err, content) {
        handleSaved(req, res, err, (err ? req.body : content), 'edit');
      });
    }
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
function handleSaved(req, res, err, content, type) {
  if(err) {
    console.log(err);
    req.flash('error', '站点保存失败!');
    res.render('cms/content/form', {
      viewType: type,
      content: content
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/cms/content/list');
  }
}
