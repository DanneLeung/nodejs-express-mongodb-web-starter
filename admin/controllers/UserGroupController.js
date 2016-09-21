/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../config/config');
var CUGroup = mongoose.model('ChannelUserGroup');
var moment = require('moment');


/*
 * list
 */
exports.list = function (req, res) {
  res.render('system/users/group/groupList');
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  // var isAdmin = req.user.isAdmin;
  // if (isAdmin == true) {
  var channelId = req.user.channelId;
  CUGroup.dataTable(req.query, {
    conditions: {
      "channel": channelId
    }
  }, function (err, data) {
    res.send(data);
  });
  // } else {
  //   res.send("");
  // }
};

/**
 * 修改分组信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  var channelId = req.user.channelId;
  CUGroup.findOne({'_id': id}, function (err, group) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/system/group/list');
    } else {
      res.render('system/users/group/groupForm', {
        //viewType: "edit",
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
    //viewType: "add",
    group: new CUGroup()
  })
};

/**
 * 检查分组名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  var channelId = req.user.channelId;
  if (newName === oldName) {
    res.send('true');
  } else {
    CUGroup.count({'channel': channelId, 'name': newName}, function (err, result) {
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
  CUGroup.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      CUGroup.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/group/list');
        }
      });
    }
  })
}
/**
 * 删除供应商
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  CUGroup.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/group/list');
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
    var user = new CUGroup(req.body);
    var channelId = req.user.channelId._id;
    user.channel = ObjectId(channelId);
    console.log("user======================>>>>>>>>>>>>>>>>", user);
    user.save(function (err, result) {
      console.log("err======================>>>>>>>>>>>>>>>>", err);
      if (err) {
        req.flash('error', err);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/system/group/list');
    });
  } else {
    // update
    CUGroup.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/system/group/list');
    });
  }
};
/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.getGroups = function (req, res) {
  var channelId = req.user.channelId;
  CUGroup.find({'channel': channelId}, function (err, groups) {
    res.send(groups);
  })
};


