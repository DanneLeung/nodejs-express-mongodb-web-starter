/**
 * 菜单管理
 */

var mongoose = require('mongoose');
var config = require('../../config/config');
var Module = mongoose.model('Module');
var ObjectId = mongoose.Types.ObjectId;

/*
 * list
 */
exports.list = function (req, res) {
    res.render('system/module/moduleList');
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  Module.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};

/**
 * 添加菜单的类别
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('system/module/moduleForm', {
    viewType: "add",
    module: new Module()
  });
};

/**
 * 修改功能模块
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.param("id");
  Module.findOne({'_id': id}, function (err, module) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/system/module');
    } else {
      res.render('system/module/moduleForm', {
        viewType: "edit",
        module: module
      })
    }
  });
};
/**
 * 删除功能模块信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Module.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/module');
    }
  });

};

/**
 * 检查模块名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Module.count({name: newName}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
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

  if (!id) {
    var module = new Module(req.body);
    module.save(function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      //更新父节点数据
      res.redirect('/system/module');
    });
  } else {
    // update
    Module.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      //更新父节点数据
      res.redirect('/system/module');
    });
  }
};

/**
 * 获取菜单填充列表框
 * @param req
 * @param res
 */
exports.getModules = function (req, res) {
  Module.find({}, function (err, module) {
    res.send(module);
  });
};

/**
 * 是否激活菜单
 * @param req
 * @param res
 */
exports.isEnabled = function (req, res) {
  var id = req.param("id");
  var updata = {};
  var options = {};
  var msg = "";
  Module.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Module.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/module');
        }
      });
    }
  });
};

/**
 * 是否可编辑
 * @param req
 * @param res
 */
exports.editable = function (req, res) {
  var id = req.param("id");
  var updata = {};
  var options = {};
  var msg = "";
  Module.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.editable == true) {
        updata.editable = false;
        msg = "以修改为不可编辑"
      } else {
        updata.editable = true;
        msg = "已修改为可编辑"
      }
      Module.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/module');
        }
      });
    }
  });
};
