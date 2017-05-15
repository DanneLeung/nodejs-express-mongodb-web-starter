/**
 * 微站点模板管理
 */
var mongoose = require('mongoose');
var config = require('../../../../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');
var fileUtl = require(config.root + '/util/file');
var imgUtil = require(config.root + '/util/imgutil');
var Template = mongoose.model('Template');
var Meta = mongoose.model('Meta');

/**
 * 模板列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  var page = Number(req.query.page);
  page = isNaN(page) ? 1 : page;
  var type = req.query.type;
  var num = 14;

  var query = {
  }
  if(!type) {
    type = 'all';
  }
  if(type != 'often' && type != 'all') {
    query.type = type;
  }
  async.parallel({
    types: function (cb) {
      Meta.findOne({
        enabled: true,
        code: 'siteTempType'
      }, (e, type) => {
        var types = [];
        if(type && type.metas && type.metas.length) {
          types = type.metas;
        }
        cb(null, types);
      });
    },
    templates: function (cb) {
      var query = {
      }
      if(!type) {
        type = 'all';
      }
      if(type != 'often' && type != 'all') {
        query.type = type;
      }
      // if(type == 'often') {

      // }

      Template.find(query).sort({ "enabled": -1 }).skip((page - 1) * num).limit(num).exec(function (err, templates) {
        if(err) {
          req.flash("error", err);
        }
        cb(null, templates);
      });
    },
    count: function (cb) {
      Template.count(query, (e, count) => {
        var page = Math.ceil(count / num);
        cb(null, { page: page, count: count });
      })
    }
  }, function (err, results) {
    results.currPage = page;
    results.num = num;
    results.currType = type;
    res.render('cms/template/list', results);
  })
  // var type = req.params.type;
  // var query = {
  // };
  // if (type) {
  //   query.type = type;
  // }
  // Template.find(query).sort({"enabled":-1}).exec(function (err, templates) {
  //   if (err) {
  //     req.flash("error", err);
  //   }
  //   res.render('cms/template/list', {
  //     templates: templates
  //   });
  // });
};
/**
 * 新建模板
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  async.parallel({
    types: function (cb) {
      Meta.findOne({
        enabled: true,
        code: 'siteTempType'
      }, (err, type) => {
        var types = [];
        if(type && type.metas && type.metas.length) {
          type.metas.sort(function (a, b) {
            return a.sort - b.sort;
          });
          types = type.metas;
        }
        cb(null, types);
      });
    },
    temps: function (cb) {
      Meta.findOne({
        enabled: true,
        code: 'siteTemp'
      }, (err, temp) => {
        var temps = [];
        if(temp && temp.metas && temp.metas.length) {
          temp.metas.sort(function (a, b) {
            return a.sort - b.sort;
          });
          temps = temp.metas;
        }
        cb(null, temps);
      });
    }
  }, function (err, results) {
    results.template = new Template();
    res.render('cms/template/form', results);
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Template.findById(id, function (err, template) {
    if(handleErr(req, err)) {
      Meta.findOne({
        enabled: true,
        code: 'siteTemp'
      }, (err, temp) => {
        var temps = [];
        if(temp && temp.metas && temp.metas.length) {
          temp.metas.sort(function (a, b) {
            return a.sort - b.sort;
          });
          temps = temp.metas;
          res.render('cms/template/form', {
            template: template,
            temps: temps
          });
        }
      });

    } else
      res.redirect('/cms/template');
  })
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  // handle checkbox unchecked.Å
  if(!req.body.enabled) req.body.enabled = false;

  var urls = req.body.linkUrl;
  var labels = req.body.linkLabel;
  var links = [];
  if(urls && labels) {
    if(urls instanceof Array) {
      urls.forEach(function (url, i) {
        if(url && labels[i]) {
          links.push({
            label: labels[i],
            url: url
          })
        }
      });
    }
  }
  req.body.links = links;
  delete req.body.linkUrl;
  delete req.body.linkLabel;
  if(!req.files || req.files.length <= 0) {
    saveOrUpdate(req.body);
  } else {
    fileUtl.saveUploadFiles(req.files, 'template', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      for(i in fs) {
        fs[i].width = fs[i].height = 400;
      }
      imgUtil.thumbnail(fs, 400, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.saveFiles(ffs, function (err, files) {
          if(err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if(files && files.length > 0) {
            for(var i = 0; i < files.length; i++) {
              var fieldname = files[i].fieldname;
              req.body[fieldname] = files[i].thumb;
            }
          }
          saveOrUpdate(req.body);
        });
      });
    });
  }

  function saveOrUpdate(data) {
    if(!id) {
      var template = new Template(data);
      template.save(function (err, newTemplate) {
        handleSaved(req, res, err, newTemplate, 'add');
      });
    } else {
      // update
      console.log(req.body);
      console.log(urls);
      Template.findByIdAndUpdate(id, data, function (err, template) {
        handleSaved(req, res, err, (err ? data : template), 'edit');
      });
    }
  }
};

/**
 * 删除数据
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var id = req.params.id;
  Template.remove({
    _id: id
  }, (err, temp) => {
    console.log('=====', err, temp);
    res.redirect('/cms/template');
  });
};

/**
 * 激活
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  console.log('============>');
  var id = req.params.id;
  Template.findOneAndUpdate({
    _id: id,
    enabled: false
  }, {
    $set: { enabled: true }
  }, (err, temp) => {

    if(err || !temp) {
      console.log(err);
      req.flash('error', '系统未找到此模板');
    } else {
      req.flash('success', '激活成功');
    }
    res.redirect('/cms/template');
  })
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
function handleSaved(req, res, err, template, type) {
  if(err) {
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
    res.redirect('/cms/template');
  }
}