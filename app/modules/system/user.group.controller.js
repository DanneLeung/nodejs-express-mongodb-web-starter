/**
 * Created by xingjie201 on 2016/2/19.
 * 用户组的Controller
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../../config/config');
var UserGroup = mongoose.model('UserGroup');
var moment = require('moment');
var async = require('async');
var Menu = mongoose.model('Menu');


/*
 * list
 */
exports.list = function (req, res) {
  res.render('system/users/group/groupList');
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  UserGroup.dataTable(req.query, {
    conditions: {}
  }, function (err, data) {
    res.send(data);
  });
};

/**
 * 修改分组信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  UserGroup.findOne({
    '_id': id
  }, function (err, group) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/system/group');
    } else {
      res.render('system/users/group/groupForm', {
        group: group
      })
    }
  });
};

/**
 * 添加分组信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('system/users/group/groupForm', {
    group: new UserGroup()
  })
};

/**
 * 检查分组名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    UserGroup.count({
      'name': newName
    }, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 是否激活用户组
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  UserGroup.findOne({
    '_id': id
  }, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      UserGroup.update({
        '_id': id
      }, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/group');
        }
      });
    }
  })
};
/**
 * 删除用户组
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  UserGroup.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/group');
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
  if (!id) {
    var user = new UserGroup(req.body);
    console.log("user======================>>>>>>>>>>>>>>>>", user);
    user.save(function (err, result) {
      console.log("err======================>>>>>>>>>>>>>>>>", err);
      if (err) {
        req.flash('error', err);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/system/group');
    });
  } else {
    // update
    UserGroup.update({
      '_id': id
    }, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/system/group');
    });
  }
};
/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.getGroups = function (req, res) {
  UserGroup.find({}, function (err, groups) {
    res.send(groups);
  })
};


/**
 * 修改用户组的信息
 * @param req
 * @param res
 */
exports.menu = function (req, res) {
  var id = req.params.id;
  UserGroup.findById(id, (err, ch) => {
    if (err) {
      console.error(err);
    } else {
      res.render('system/users/group/menuList', {
        userGroup: ch
      })
    }
  });
};
