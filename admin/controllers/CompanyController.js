/**
 * Created by xingjie201 on 2016/3/28.
 */

var mongoose = require('mongoose')
  , Company = mongoose.model('Company')
  , config = require('../../config/config');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
var fs = require('fs');
var fileUtl = require('../../util/file');
var imgUtil = require('../../util/imgutil');

/*
 * list
 */
exports.list = function (req, res) {
  res.render('member/company/list')
};

/*user list table json datasource*/
exports.datatable = function (req, res) {
  var channelId = req.user.channelId;
  Company.dataTable(req.query, {conditions: {channel: channelId}}, function (err, data) {
    res.send(data);
  });
};

/**
 * 添加公司信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('member/company/form', {
    company: new Company()
  })
};
/**
 * 编辑公司信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id || req.body.id;
  Company.findById({'_id': id}, function (err, company) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/member/company/list');
    } else {
      res.render('member/company/form', {
        company: company
      });
    }
  });
};

/**
 * 删除公司信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.id || req.params.id;
  Company.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
    }
    res.redirect('/member/company/list');
  });

};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id ? req.body.id : new ObjectId();
  fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'company', true, function (fs) {
    for (i in fs) {
      if ('logo' == fs[i].fieldname) {
        fs[i].width = fs[i].height = 200;
      }//200
      if ('bgimg' == fs[i].fieldname) {
        fs[i].width = fs[i].height = 800;
      }//800
    }
    imgUtil.thumbnail(fs, 200, function (ffs) {
      fileUtl.normalize(ffs, function (err, files) {
        console.log("files==============", files);
        mergeArray(req)
        //更新文件路径
        for (i in files) {
          req.body[files[i].fieldname] = files[i].thumb;
        }
        //删除未上传
        if (!req.body.logo) {
          delete req.body.logo
        }
        if (!req.body.bgimg) {
          delete req.body.bgimg
        }

        // 更新数据
        var company = new Company(req.body);
        req.body.channel = req.session.channelId;
        Company.findByIdAndUpdate(id, req.body, {new: true, upsert: true}, function (err, result) {
          console.log("result==========result", result);
          if (err) {
            console.error(err);
            req.flash('error', err.message);
          } else {
            req.flash('success', '数据修改成功!');
          }
          res.redirect('/member/company/list');
        });
      })
    });
  })
};

/**
 * 合并前端的单个值为数组集合
 * @param req
 */
function mergeArray(req) {
  var names = req.body.name;
  var labels = req.body.label;
  var types = req.body.type;
  var values = req.body.val;
  req.body.settings = [];
  if (names instanceof Array) {
    for (var i = 0; i < names.length; i++) {
      var a = {};
      a.name = names[i];
      a.label = labels[i];
      a.type = types[i];
      a.value = values[i];
      req.body.settings.push(a)
    }
  } else {
    if (names) {
      var b = {};
      b.name = names;
      b.label = labels;
      b.type = types;
      b.value = values;
      req.body.settings.push(b)
    }
  }
}


/**
 * 检查名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var name = req.query.fullname || req.body.fullname;
  var oldName = req.query.oldName || req.body.oldName;
  if (name == oldName) {
    res.send('true');
  } else {
    Company.count({'fullname': name}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};


/**
 * 是否激活供应商
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Company.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Company.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/member/company/list');
        }
      });

    }
  });
};

/**
 * 获取该公司的参数
 * @param req
 * @param res
 */
exports.getSettRing = function (req, res) {
  var id = req.params.id;
  Company.findById(id, function (err, info) {
    if (info) {
      res.send(info.settings);
    } else {
      res.send([]);
    }
  });
};
