/**
 * Created by danne on 2016-04-28.
 */
/**
 * 贷款产品
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

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
  Loan.dataTable(req.query, {conditions: {'channel': req.session.channelId}}, function (err, data) {
    res.send(data);
  });
};

/**
 * list
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  res.render('bank/loan/list');
};

/**
 * 添加产品
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('bank/loan/loanForm', {loan: new Loan()});
};

/**
 * 编辑产品
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Loan.findOne({_id: id}, function(err, loan) {
    if(err) {
      req.flash('error', err);
      return res.redirect('/bank/loan/list');
    }

    if(!loan) {
      req.flash('error', '系统没有找到');
      return res.redirect('/bank/loan/list');
    }
    res.render('bank/loan/loanForm', {loan: loan});
  });
};

/**
 * 获取类型
 * @param req
 * @param res
 */
exports.getType = function (req, res) {
  LoanType.find({
    channel: req.session.channelId,
    parent: {$exists: true}
  }, function(err, types) {
    if(!err && types) {
      var newTypes = [];
      types.forEach(function(type) {
        newTypes.push({
          name: type.type + '--' + type.name,
          id: type._id
        });
      });
      return res.send({
        success: true,
        types: newTypes
      });
    } else {
      return res.send({
        success: false,
        types: null
      });
    }
  });
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
    Loan.count({'name': newName, 'channel': channel}, function (err, result) {
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
  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req, res);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'loan', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.normalize(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if (files) {
            req.body.logo = files[0].thumb;
          }
          // 更新时处理替换文件情况，新文件保存后旧文件删除
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
  req.body.enabled = (typeof req.body.enabled !== 'undefined') ? true : false;
  if (!id) {
    req.body.channel = req.session.channelId;
    var type = new Loan(req.body);
    type.save(function (err, result) {
      handleSaved(req, res, err, result);
    });
  } else {
    // update
    Loan.findByIdAndUpdate(id, req.body, function (err, result) {
      handleSaved(req, res, err, result);
    });
  }
}

// handle object saved
function handleSaved(req, res, err, loan) {
  if (err) {
    req.flash('error', '活动保存失败!' + err);
    res.render('bank/loan/loanForm', {
      loan: loan == null ? new loan() : loan
    });
  } else {
    req.flash('success', '站点保存成功!');
    res.redirect('/bank/loan/list');
  }
}

/**
 * 删除产品分类
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var id = req.params.id;
  Loan.findOne({_id: id}, function(err, loan) {
    if(err) {
      req.flash('error', err);
      return res.redirect('/bank/loan/list');
    }
    if(!loan) {
      req.flash('error', '系统没有找到此条记录');
      return res.redirect('/bank/loan/list');
    }

    Loan.remove({_id: id}, function (err, result) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/bank/loan/list');
      } else {
        req.flash('success', '数据删除成功!');
        res.redirect('/bank/loan/list');
      }
    })
  });
};


/**
 * 激活产品
 * @param req
 * @param res
 */
exports.enabled = function (req, res) {
  var id = req.params.id;
  Loan.findOne({_id: id}, function(err, loan) {
    if(err) {
      req.flash('error', err);
      return res.redirect('/bank/loan/list');
    }
    if(!loan) {
      req.flash('error', '系统没有找到此条记录');
      return res.redirect('/bank/loan/list');
    }
    loan.enabled = !loan.enabled;
    loan.save();
    req.flash('success','操作成功');
    return res.redirect('/bank/loan/list');
  });
};
