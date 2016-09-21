/**
 * Created by danne on 2016-04-28.
 */
/**
 * 贷款产品
 */
var mongoose = require('mongoose');
var async = require('async');
var moment = require('moment');
var validator = require('validator');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');
var Loan = require('./loan.model');
var LoanType = require('./loan.type.model');

/**
 * datatable
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  LoanType.dataTable(req.query, {conditions: {'channel': req.session.channelId}}, function (err, data) {
    res.send(data);
  });
};

/**
 * 产品分类
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('bank/loan/type/list', {});
};

/**
 * 添加产品分类
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('bank/loan/type/form', {type: new LoanType()});
};

/**
 * 编辑产品分类
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  LoanType.findOne({_id: id}, function(err, type) {
    if(err) {
      req.flash('error', err);
      return res.redirect('/bank/loan/type');
    }

    if(!type) {
      req.flash('error', '系统没有找到');
      return res.redirect('/bank/loan/type');
    }
    res.render('bank/loan/type/form', {type: type});
  });
};

/**
 * 查找父类
 * @param req
 * @param res
 */
exports.parent = function (req, res) {
  var id = req.body.id;
  var query = {
    channel: req.session.channelId,
    parent: {$exists: false}
  };
  if(id && id.length > 0) {
    query['_id'] = {$ne: id};
  }

  LoanType.find(query, function(err, types) {
    if(!err && types) {
      var newTypes = [];
      types.forEach(function(type) {
        newTypes.push({
          name: type.name,
          id: type._id
        });
      });
      res.json({
        success: true,
        types: newTypes
      });
    } else {
      res.send({
        success: false,
        types: null
      })
    }
  })
};

/**
 * 编辑产品分类
 * @param req
 * @param res
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  var channel = req.session.channelId;
  if (newName === oldName) {
    res.send('true');
  } else {
    LoanType.count({'name': newName, 'channel': channel}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }

};

/**
 * 添加产品分类
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  console.log(req.body);
  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req, res);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'loan', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      imgUtil.thumbnail(fs, 70, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.normalize(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if (files) {
            for (var i = 0; i < files.length; i++) {
              var fieldname = files[i].fieldname;
              req.body[fieldname] = files[i].thumb;
            }
          }
          saveOrUpdate(id, req, res);
        })
      });
    });
  }
};

/**
 * 保存方法
 * @param id
 * @param req
 * @param res
 */
function saveOrUpdate(id, req, res) {
  if(req.body.parent.length == 0) {
    delete req.body.parent;
    req.body.type = req.body.name;
  }
  if(typeof req.body.parent !== 'undefined' && req.body.parent.length > 0) {
    req.body.type = req.body.parent.split(',')[1];
    req.body.parent = req.body.parent.split(',')[0];
  }
  req.body.enabled = (typeof req.body.enabled !== 'undefined') ? true : false;
  if (!id) {
    req.body.channel = req.session.channelId;
    var type = new LoanType(req.body);
    type.save(function (err, result) {
      handleSaved(req, res, err, result);
    });
  } else {
    // update
    LoanType.findByIdAndUpdate(id, req.body, function (err, result) {
      handleSaved(req, res, err, result);
    });
  }
}

// handle object saved
function handleSaved(req, res, err, type) {
  if (err) {
    req.flash('error', '活动保存失败!' + err);
    res.render('bank/loan/type/form', {
      type: type == null ? new LoanType() : type
    });
  } else {
    req.flash('success', '站点保存成功!');
    res.redirect('/bank/loan/type');
  }
}

/**
 * 删除产品分类
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var id = req.params.id;
  LoanType.findOne({_id: id}, function(err, type) {
    if(err) {
      req.flash('error', err);
      return res.redirect('/bank/loan/type');
    }
    if(!type) {
      req.flash('error', '系统没有找到此条记录');
      return res.redirect('/bank/loan/type');
    }

    if(type.parent) {
      LoanType.remove({_id: id}, function (err, result) {
        if(err) {
          req.flash('error', err);
          return res.redirect('/bank/loan/type');
        } else {
          req.flash('success', '数据删除成功!');
          res.redirect('/bank/loan/type');
        }
      });
    } else {
      //父级
      LoanType.remove({$or: [{_id: id}, {'parent': id}]}, function (err, result) {
        if(err) {
          req.flash('error', err);
          return res.redirect('/bank/loan/type');
        } else {
          req.flash('success', '数据删除成功!');
          res.redirect('/bank/loan/type');
        }
      });
    }
  });
};

/**
 * 激活产品分类
 * @param req
 * @param res
 */
exports.enabled = function (req, res) {
  var id = req.params.id;
  LoanType.findOne({_id: id}, function(err, type) {
    if(err) {
      req.flash('error', err);
      return res.redirect('/bank/loan/type');
    }
    if(!type) {
      req.flash('error', '系统没有找到此条记录');
      return res.redirect('/bank/loan/type');
    }
    type.enabled = !type.enabled;
    type.save();
    req.flash('success','操作成功');
    return res.redirect('/bank/loan/type');
  });
};
