/**
 * Created by xingjie201 on 2016/2/19.
 * 用户的Controller
 */

var fs = require('fs');
var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var excal = require('excel-export');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('lodash');

var config = require('../../../../config/config');

var User = mongoose.model('User');
var UserGroup = mongoose.model('UserGroup');
var excelUtil = require(config.root + '/util/excelUtil');
var fileUtil = require(config.root + '/util/file');

/*
 * list
 */
exports.list = function (req, res) {
  async.parallel({
    groups: function (callback) {
      UserGroup.all(groups => callback(null, groups))
    }
  }, function (err, result) {
    res.render('admin/system/users/userList', {
      user: "",
      groups: result.groups
    });
  });
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  var isAdmin = req.user.isAdmin;
  if (isAdmin == true) {
    var query = getQuery(req);
    User.dataTable(req.query, {
      conditions: query
    }, function (err, data) {
      res.send(data);
    });
  } else {
    User.dataTable(req.query, {conditions: { }}, function (err, data) {
      res.send(data);
    });
  }
};

function getQuery(req) {
  var query = {};
  if (req.query.username) {
    query.username = req.query.username;
  }
  if (req.query.fullname) {
    query.fullname = req.query.fullname;
  }
  if (req.query.mobile) {
    query.mobile = req.query.mobile;
  }
  return query;
}

/**
 * 修改用户的信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  var branchGroup = req.session.branchGroup;
  var branchIds = req.session.branchIds;
  async.parallel({
    user: function (callback) {
      User.findById(id).exec((err, user) => {
        callback(null, user)
      })
    },
    groups: function (callback) {
      UserGroup.all( groups => callback(null, groups))
    }
  }, function (err, result) {
    res.render('admin/system/users/userForm', {
      user: result.user,
      groups: result.groups
    });
  });

};

/**
 * 修改用户的信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  var branchGroup = req.session.branchGroup;
  var branchIds = req.session.branchIds;
  async.parallel({
    groups: function (callback) {
      UserGroup.all( groups => callback(null, groups))
    }
  }, function (err, result) {
    res.render('admin/system/users/userForm', {
      user: new User(),
      groups: result.groups
    });
  });
};
/**
 * 修改用户的信息
 * @param req
 * @param res
 */
exports.approved = function (req, res) {
  var id = req.params.id || req.body.id;
  User.findOne({'_id': id}, function (err, user) {
    if (!err) {
      res.render('admin/system/users/UserApprForm', {
        viewType: "view",
        user: user ? user : new User()
      })
    }
  });

};
/**
 * 重置管理员密码
 * @param req
 * @param res
 */
exports.resetUserPwd = function (req, res) {
  var id = req.params.id;
  User.findOne({'_id': id}, function (err, user) {
    if (user) {
      var pwd = user.encryptPassword("123456");
      var updata = {hashed_password: pwd};
      // update
      User.update({'_id': user._id}, updata, function (err, result) {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', '密码已重置成功!');
        }
        return res.redirect('/admin/system/user/edit/' + id);

      });
    }
  });
};
/**
 * 重置所选用户的密码
 * @param req
 * @param res
 */
exports.resetPwd = function (req, res) {
  var users = req.params.users || req.body.users;
  var ids = users.split(",");
  User.find({'_id': {$in: ids}}, function (err, user) {
    for (var i in user) {
      var pwd = user[i].encryptPassword("123456");
      var updata = {hashed_password: pwd};
      User.update({'_id': user[i]._id}, updata, function (err, result) {
      });
    }
    req.flash('success', "密码重置成功：123456");
    res.redirect('/admin/system/user');
  });
};
exports.changepwd = function (req, res) {
  var id = req.body.id || req.params.id;
  var oldPassWord = req.body.oldPassWord;
  var newPassWord = req.body.newPassWord;
  console.log("************ id, oldPassWord, newPassWord ", id, oldPassWord, newPassWord);
  if (id) {
    if (!oldPassWord || !newPassWord) {
      res.render("admin/system/users/changepwd", {id: id});
      return;
    }
    User.findOne({'_id': id}, function (err, user) {
      if (user) {
        oldPassWord = user.encryptPassword(oldPassWord);
        if (user.hashed_password !== oldPassWord) {
          console.error('("************ 输入的原登录密码不正确，请重试!');
          req.flash('error', '输入的原登录密码不正确，请重试!');
          return res.redirect('/admin/system/user/changepwd/' + id);
          return;
        }
        newPassWord = user.encryptPassword(newPassWord);
        var updata = {hashed_password: newPassWord};
        // update
        User.update({'_id': id}, updata, function (err, result) {
          if (err) {
            req.flash('error', err.message);
          } else {
            req.flash('success', '修改登录密码成功，请使用新密码登录系统!');
          }
          return res.redirect('/admin/system/user/changepwd/' + id);
        });
      } else {
        return res.redirect('/admin/system/user/changepwd/' + id);
      }
    });
  } else {
    return res.redirect('/admin/system/user/changepwd/' + id);
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
  if (newName === oldName) {
    res.send('true');
  } else {
    User.count({'username': newName}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};
/**
 * 检查角色名称是否已经存在^
 */
exports.checkNo = function (req, res) {
  var newName = req.query.empNo;
  var oldName = req.query.oldNo;
  if (newName === oldName) {
    res.send('true');
  } else {
    User.count({'empNo': newName}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 是否激活用户
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  User.findOne({'_id': id}, function (err, info) {
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
        User.update({'_id': id}, updata, options, function (err, info) {
          if (!err) {
            req.flash('success', msg);
            res.redirect('/admin/system/user');
          }
        });
      }
    }
  });
};
/**
 * 删除用户
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  var id = req.user._id;
  if (ids == id) {
    req.flash('error', '不可删除自己');
    res.redirect('/admin/system/user');
  } else {
    ids = ids.split(',');

    User.remove({'_id': {$in: ids}}, function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err);
      } else {
        req.flash('success', '数据删除成功!');
        res.redirect('/admin/system/user');
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
  req.body.group = req.body.group ? ObjectId(req.body.group) : null;
  if (!id) {
    var user = new User(req.body);
    user.save(function (err, result) {
      if (err) {
        req.flash('error', err.errors.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/admin/system/user');
    });
  } else {

    User.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/admin/system/user');
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
  User.findOne({'_id': id}, function (err, user) {
    if (!err) {
      if ('02' === req.body.approvedStatus) {
        req.body.enabled = true;
        req.body.approved = true;
      }
      req.body.approvedTime = new Date();
      req.body.approvedBy = req.user.username;

      User.update({'_id': user._id}, req.body, function (err, result) {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', '用户审核处理成功!');
        }
        res.redirect('/admin/system/user');
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
  for (var i in users) {
    User.update({'_id': users[i]}, {group: group}, function (err, result) {
    });
  }
  req.flash('success', '用户已分组');
  res.redirect('/admin/system/user');
};

/**
 * 给用户分组
 * @param req
 * @param res
 */
exports.setGroupAndBranch = function (req, res) {
  var userIds = req.body.userIds || req.params.userIds;
  var branchGroup = req.body.branchGroup || req.params.branchGroup;
  var branch = req.body.branch || req.params.branch;
  console.log("userIds========================>>>>>>>>>>>>>>>>", userIds);
  var users = userIds.split(",");
  for (var i in users) {
    User.update({'_id': users[i]}, {branchGroup: branchGroup, branch: branch}, function (err, result) {
    });
  }
  req.flash('success', '用户二级行和网点修改成功');
  res.redirect('/admin/system/user');
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
  User.findOne({'_id': id}, function (err, user) {
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
        var updata = {hashed_password: pwd};
        // update
        User.update({'_id': user._id}, updata, function (err, result) {
          if (err) {
            req.flash('error', err.message);
          } else {
            req.flash('success', user.username + ' 的密码修改成功! 密码为：' + password);
          }
          if (req.user.isAdmin && !(req.user._id == user._id)) {
            res.redirect('/admin/system/user/list');
          } else {
            res.redirect('/login');
          }
        });
      } else {
        req.flash('error', "原密码不正确");
        res.redirect('/admin/system/user');
      }

    }
  });
};

exports.userChannelAdd = function (req, res) {
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
    ChannelType.count({'typeName': newName}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};
 

/**
 * 导入用户信息
 * @param req
 * @param res
 */
exports.importUser = function (req, res) {
  fileUtil.saveUploadFiles(req.files, req.session.channel.identity, 'award', true, function (files) {
    if (files) {
      var obj = excelUtil.readXls(files[0].path, 1);
      if (!obj || !obj.length) {
        req.flash('error', "读入失败！");
        return res.redirect('/admin/system/user/list');
      }
      console.log("*************** read excel end ...");
      var data = obj[0].data;
      if (data == null) {
        req.flash('error', "导入文件格式不正确");
        return res.redirect('/admin/system/user/list');
      } else {
        hanble(data, channel, function (err, result) {
          if (result) {
            if (err) {
              req.flash('error', err + "这些用户名已经存在！其他数据已导入成功");
            } else {
              req.flash('success', "用户数据已导入成功");
            }
          } else if (err) {
            req.flash('error', err);
          }
          res.redirect('/admin/system/user/list');
        });
      }
    } else {
      req.flash('error', "未选择文件");
      res.redirect('/admin/system/user/list');
    }
  })
};

function hanble(data, channel, callback) {
  var username = -1;
  var empNo = -1;
  var fullname = -1;
  var branch = -1;
  var group = -1;
  var tel = -1;
  var mobile = -1;
  var email = -1;
  var numberID = -1;
  var index = 0;
  for (var i in data[0]) { //获取数据字段的下标
    switch (data[0][i]) {
      case "用户名":
        username = index;
        break;
      case "工号":
        empNo = index;
        break;
      case "姓名":
        fullname = index;
        break;
      case "网点":
        branch = index;
        break;
      case "二级行":
        group = index;
        break;
      case "电话":
        tel = index;
        break;
      case "手机号":
        mobile = index;
        break;
      case "邮箱":
        email = index;
        break;
      case "身份证":
        numberID = index;
        break;
      default:
        break;
    }
    index += 1;
  }
  data.splice(0, 1);
  async.map(data, function (e, cb) {
    var uname = e[username] + "";
    var salt = User.makeSalt();
    var password = User.encryptPassword('123456', salt);

    User.count({ username: uname}, function (err, result) {
      if (result == 0) {
        async.parallel({
          branch: function (callback) {
            if (e[branch] == '无') {
              callback(null, null);
            } else {
              Branch.findOne({name: e[branch]}, function (err, b) {
                callback(err, b);
              });
            }
          },
          group: function (callback) {
            if (e[group] == '无') {
              callback(null, null);
            } else {
              BranchGroup.findOne({name: e[group]}, function (err, b) {
                callback(err, b);
              });
            }
          }
        }, function (err, result) {
          var user = {
            username: username != -1 ? uname : '',
            empNo: empNo != -1 ? e[empNo] : '',
            fullname: fullname != -1 ? e[fullname] : '',
            tel: tel != -1 ? e[tel] : '',
            mobile: mobile != -1 ? e[mobile] : '',
            email: email != -1 ? e[email] : '',
            numberID: numberID != -1 ? e[numberID] : '',
            verification: 1,
            enabled: true,
            hashed_password: password,
            salt: salt,
            approved: true,
            approvedStatus: '02'
          };
          if (result.branch) {
            user.branch = result.branch._id;
          }
          if (result.group) {
            user.branchGroup = result.group._id;
          }
          cb(err, user);
        })
      } else {
        cb(uname, null);
      }
    });
  }, function (err, result) {
    if (result && result.length > 0) {
      var data = [];
      for (var i in result) {
        if (result[i]) {
          data.push(result[i])
        }
      }
      mongoose.connection.collections['Users'].insertMany(data, {ordered: false}, function (cerr, result) {
        callback(err, result);
      });
    } else {
      callback(err, result);
    }
  });
}

/**
 * 导出用户
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
    caption: '工号',
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
};

function queryMember(callback) {
  var users = [];
  for (var i = 1; i < 4; i++) {
    var item = [i, "example" + i + "", "NT549322" + i + "", "example" + i + "", "021-333388" + i + "", "1588888999" + i + "", "Email" + i + "@163.com", "41272219000909668" + i + "", 1];
    users.push(item);
  }
  callback(null, users);
}

/**
 * 导出订单信息
 * @param req
 * @param res
 */
exports.export = function (req, res) {
  var label = "二级行" + "," + "网点" + "," + "用户名" + "," + "工号" + "," + "姓名" + "," + "手机号" + "," + "邮箱" + "," + "职位" + "\n";
  var query = getQuery(req);
  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  getEvent(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "user" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(label);
  })
};

