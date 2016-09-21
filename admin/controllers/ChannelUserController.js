/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../config/config');
var ChannelUser = mongoose.model('ChannelUser');
var Channel = mongoose.model('Channel');
var Branch = mongoose.model('Branch');
var ChannelType = mongoose.model('ChannelType');
var excalUtil = require('../../util/excalUtil');
var moment = require('moment');
var excal = require('excel-export');
var fs = require('fs');

/*
 * list
 */
exports.list = function (req, res) {
  res.render('system/users/userList', {
    user: ""
  })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  var isAdmin = req.user.isAdmin;
  if (isAdmin == true) {
    var channelId = req.user.channelId;
    ChannelUser.dataTable(req.query, {
      conditions: {
        "channelId": channelId,
        "approvedStatus": { $nin: ["00"] }
      }
    }, function (err, data) {
      res.send(data);
    });
  } else {
    var _id = req.user._id;
    ChannelUser.dataTable(req.query, { conditions: { "_id": _id } }, function (err, data) {
      res.send(data);
    });
  }
};

/*
 * list
 */
exports.findUserByBranchList = function (req, res) {
  var branchId = req.params.id;
  res.render('system/users/userListInBranch', {
    branchId: branchId
  })
};


/*role list table json datasource*/
exports.byBranchDataTable = function (req, res) {
  var channelId = req.user.channelId;
  var branchId = req.params.id;

  ChannelUser.dataTable(req.query, {
    conditions: {
      "channelId": channelId,
      "branch": branchId,
      "approvedStatus": { $nin: ["00"] }
    }
  }, function (err, users) {
    if (err) {
      console.log("err=========================<>>>>>>>>>>>>>>>>>>", err)
    } else {
      res.send(users);
    }
  });
};

/**
 * 修改供应商的信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  var channelId = req.user.channelId;
  ChannelUser.findOne({ '_id': id }, function (err, user) {
    var result = {};
    return Branch.find({ "channel": channelId }).exec().then(function (branch) {
      result.user = user;
      result.branchs = branch;
      return result;
    }).then(function (result) {
      res.render('system/users/userForm', {
        //viewType: "edit",
        user: result.user,
        branchs: result.branchs
      })
    }).then(undefined, function (err) {
      if (err) {
        console.log(err);
        req.flash('error', err);
        res.redirect('/channel/userList');
      }
    });
  });
};

/**
 * 修改供应商的信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  var channelId = req.user.channelId;
  Branch.find({ "channel": channelId }, function (err, branch) {
    res.render('system/users/userForm', {
      // viewType: "add",
      branchs: branch,
      user: new ChannelUser()
    })

  });

};
/**
 * 修改供应商的信息
 * @param req
 * @param res
 */
exports.approved = function (req, res) {
  var id = req.params.id || req.body.id;
  ChannelUser.findOne({ '_id': id }, function (err, user) {
    if (!err) {
      res.render('system/users/channelUserApprForm', {
        viewType: "view",
        user: user ? user : new ChannelUser()
      })
    }
  });


};
/**
 * 重置渠道管理员密码
 * @param req
 * @param res
 */
exports.resetUserPwd = function (req, res) {
  var id = req.params.id;
  ChannelUser.findOne({ '_id': id }, function (err, user) {
    if (user) {
      var pwd = user.encryptPassword("123456");
      var updata = { hashed_password: pwd };
      // update
      ChannelUser.update({ '_id': user._id }, updata, function (err, result) {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', '密码已重置成功!');
        }
        return res.redirect('/system/user/edit/' + id);

      });
    }
  });
};
exports.changepwd = function (req, res) {
  var id = req.body.id || req.params.id;
  var oldPassWord = req.body.oldPassWord;
  var newPassWord = req.body.newPassWord;
  console.log("************ id, oldPassWord, newPassWord ", id, oldPassWord, newPassWord);
  if (id) {
    if (!oldPassWord || !newPassWord) {
      res.render("system/users/changepwd", { id: id });
      return;
    }
    ChannelUser.findOne({ '_id': id }, function (err, user) {
      if (user) {
        oldPassWord = user.encryptPassword(oldPassWord);
        if (user.hashed_password !== oldPassWord) {
          console.error('("************ 输入的原登录密码不正确，请重试!');
          req.flash('error', '输入的原登录密码不正确，请重试!');
          return res.redirect('/system/user/changepwd/' + id);
          return;
        }
        newPassWord = user.encryptPassword(newPassWord);
        var updata = { hashed_password: newPassWord };
        // update
        ChannelUser.update({ '_id': id }, updata, function (err, result) {
          if (err) {
            req.flash('error', err.message);
          } else {
            req.flash('success', '修改登录密码成功，请使用新密码登录系统!');
          }
          return res.redirect('/system/user/changepwd/' + id);
        });
      } else {
        return res.redirect('/system/user/changepwd/' + id);
      }
    });
  } else {
    return res.redirect('/system/user/changepwd/' + id);
  }
};
/**
 * 生成六位密码
 * @param req
 * @param res
 */
exports.autoGenerations = function (req, res) {
  var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  var str = "";
  for (var i = 0; i < 6; i++) {
    var id = Math.ceil(Math.random() * 35);
    str += chars[id];
  }
  res.send(str);
};
/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.username;
  var oldName = req.query.oldName;
  var channelId = req.user.channelId;
  if (newName === oldName) {
    res.send('true');
  } else {
    ChannelUser.count({ 'channelId': channelId, 'username': newName }, function (err, result) {
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
  ChannelUser.findOne({ '_id': id }, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      if (info.isAdmin) {
        req.flash('error', "管理员本身不可禁用");
        res.redirect('/channel/userList');
      } else {
        ChannelUser.update({ '_id': id }, updata, options, function (err, info) {
          if (!err) {
            req.flash('success', msg);
            res.redirect('/system/user/list');
          }
        });
      }
    }
  });
};
/**
 * 删除供应商
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  var id = req.user._id
  if (ids == id) {
    req.flash('error', '不可删除自己');
    res.redirect('/system/user/list');
  } else {
    ids = ids.split(',');

    ChannelUser.remove({ '_id': { $in: ids } }, function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err);
      } else {
        req.flash('success', '数据删除成功!');
        res.redirect('/system/user/list');
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
  var branch = req.body.branch;
  if (!id) {
    var user = new ChannelUser(req.body);
    var channelId = req.user.channelId._id;
    user.channelId = ObjectId(channelId);
    if (branch == "") {
      user.branch = null;
    }
    console.log("user======================>>>>>>>>>>>>>>>>", user);
    user.save(function (err, result) {
      console.log("err======================>>>>>>>>>>>>>>>>", err);
      if (err) {
        req.flash('error', err.errors.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/system/user/list');
    });
  } else {
    // update
    if (branch == "") {
      req.body.branch = null;
    }
    ChannelUser.update({ '_id': id }, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/system/user/list');
    });
  }
};


/**
 * 自助申请用户信息的审核
 * @param req
 * @param res
 */
exports.saveApproved = function (req, res) {
  var id = req.body.id;
  ChannelUser.findOne({ '_id': id }, function (err, user) {
    if (!err) {
      req.body.enabled = true;
      req.body.approvedTime = new Date();
      req.body.approvedBy = req.user.fullname;

      ChannelUser.update({ '_id': user._id }, req.body, function (err, result) {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', '数据修改成功!');
        }
        res.redirect('/system/user/list');
      });
    }
  })
};

/**
 * 自助申请用户设置网点/门店
 * @param req
 * @param res
 */
exports.setBranchAndPlace = function (req, res) {
  var userIds = req.body.userIds || req.params.userIds;
  console.log("userIds========================>>>>>>>>>>>>>>>>", userIds);
  ChannelUser.findOne({ '_id': userIds }, function (err, user) {
    if (!err) {
      // update
      ChannelUser.update({ '_id': user._id }, req.body, function (err, result) {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', '网点/门店、职位设置完成!');
        }
        res.redirect('/system/user/list');
      });
    }
  })
};

/**
 * 给用户分组
 * @param req
 * @param res
 */
exports.setGroup = function (req, res) {
  var userIds = req.body.groupUserIds || req.params.groupUserIds;
  var group = req.body.group || req.params.group;
  console.log("userIds========================>>>>>>>>>>>>>>>>", userIds);
  var users = userIds.split(",");
  ChannelUser.find({ '_id': { $in: users } }, function (err, users) {
    if (!err) {
      // update
      users.forEach(function (user) {
        user.group = group;
        ChannelUser.update({ '_id': user._id }, user, function (err, result) {
          if (err) {
            req.flash('error', err.message);
          }
        });
      });
      req.flash('success', '用户已分组');
      res.redirect('/system/user/list');
    }
  })
};


/**
 * 修改密码
 * @param req
 * @param res
 */
exports.editPassWord = function (req, res) {
  var id = req.body.userId;
  var oldPassWord = req.body.oldPassWord;
  var selectMonth = req.body.selectMonth;
  var newPassWord = req.body.newPassWord;
  var PassWord = req.body.PassWord;
  ChannelUser.findOne({ '_id': id }, function (err, user) {
    if (!err) {
      if (user.authenticate(oldPassWord)) {
        var pwd = "";
        var password = "";
        if (selectMonth == '1') {
          pwd = user.encryptPassword(newPassWord);
          password = newPassWord;
        } else {
          pwd = user.encryptPassword(PassWord);
          password = PassWord;
        }
        var updata = { hashed_password: pwd };
        // update
        ChannelUser.update({ '_id': user._id }, updata, function (err, result) {
          if (err) {
            req.flash('error', err.message);
          } else {
            req.flash('success', user.username + ' 的密码修改成功! 密码为：' + password);
          }
          if (req.user.isAdmin && !(req.user._id == user._id)) {
            res.redirect('/system/user/list');
          } else {
            res.redirect('/login');
          }
        });
      } else {
        req.flash('error', "原密码不正确");
        res.redirect('/system/user/list');
      }

    }
  });
};


exports.userChannelAdd = function (req, res) {
  console.log(1111);
  res.render('channel/channelForm', {
    //viewType: "add",
    info: new Channel()
  })
};

exports.getChannelType = function (req, res) {
  ChannelType.find({}, function (err, service) {
    res.send(service);
  });
};

exports.checkname = function (req, res) {
  var newName = req.query.typeName;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    ChannelType.count({ 'typeName': newName }, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.channelSave = function (req, res) {
  var info = new Channel(req.body);
  info.save(function (err, result) {
    if (err) {
      console.log("==========================================");
      console.log(err);
      req.flash('error', err.message);
    } else {
      console.log("channelUserId", "=========================>", req.user._id);
      console.log("channelId", "=========================>", result._id);
      ChannelUser.findByIdAndUpdate(req.user._id, { $set: { channelId: result._id } }, { new: true }, function () {
        req.flash('success', '数据保存成功!');
        res.redirect('/dashboard');
      });
    }
  });
};

exports.getAllBranch = function (req, res) {
  var channelId = req.user.channelId;
  Branch.find({ 'channel': channelId }, function (err, branch) {
    if (err) {
      console.log(err);
    }
    res.send(branch);
  });
};

/**
 * 导入渠道用户信息
 * @param req
 * @param res
 */
exports.importUser = function (req, res) {
  var filePath = req.body.filePath || req.params.filePath;
  var channel = req.user.channelId;
  var data = excalUtil.readXlsx(filePath, 2);
  if (data == null) {
    req.flash('error', "导入文件格式不正确");
  } else {
    data.forEach(function (e) {
      ChannelUser.count({ channelId: channel, username: e[1] }, function (err, result) {
        if (result == 0) {
          var user = new ChannelUser({
            username: e[1],
            fullname: e[2],
            tel: e[3],
            mobile: e[4],
            email: e[5],
            numberID: e[6],
            verification: e[7],
            channelId: channel,
            enabled: false,
            password: "123456",
            approvedStatus: '01'
          });
          user.save(function (err, m) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    });
    req.flash('success', "用户名重复的将忽略掉,其他数据以导入");
  }
  res.redirect('/system/user/list');
};

/**
 * 导出订单
 * @param req
 * @param res
 */
exports.exportUser = function (req, res) {
  var conf = {};
  conf.cols = [{ //导出文件的标题
    caption: '序号',
    type: 'number',
    width: 10
  }, {
    caption: '用户名',
    type: 'string',
    width: 30
  }, {
    caption: '姓名',
    type: 'string',
    width: 30
  }, {
    caption: '电话(请输入字符格式)',
    type: 'string',
    width: 25
  }, {
    caption: '手机号(请输入字符格式)',
    type: 'string',
    width: 25
  }, {
    caption: '邮箱',
    type: 'string',
    width: 25
  }, {
    caption: '身份证(请输入字符格式)',
    type: 'string',
    width: 30
  }, {
    caption: '手机是否验证(1:是，0:否)',
    type: 'number',
    width: 25
  }];
  queryMember(function (err, users) {
    conf.rows = users; //数据内容
    var result = excal.execute(conf);
    var filename = "user" + moment().format("YYYYMMDDhhmmss") + ".xlsx"; //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(result, 'binary');
  });
}

function queryMember(callback) {
  var users = [];
  for (var i = 1; i < 4; i++) {
    var item = [i, "example" + i + "", "example" + i + "", "021-333388" + i + "", "1588888999" + i + "", "Email" + i + "@163.com", "41272219000909668" + i + "", 1];
    users.push(item);
  }
  callback(null, users);
}
