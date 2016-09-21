/**
 * Created by yu869 on 2016/3/15.
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var User = mongoose.model('User');
var SmsSetting = mongoose.model('SmsSetting');
var Setting = mongoose.model('Setting');
var CheckCode = mongoose.model('CheckCode');

var nodemailer = require("nodemailer");

var smsUtil = require('../../util/smsUtil');

exports.login = function (req, res) {
  res.render('login', {
    title: '登录系统'
  })
};

// login to system.
var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  req.flash('success', '欢迎登录系统！');
  res.redirect(redirectTo);
};


/**
 * Session
 */
exports.session = login;

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/')
};

/**
 * Create user
 */
exports.create = function (req, res, next) {
  var user = new User(req.body);
  user.provider = 'local';
  console.log("create user ... " + user);
  user.save(function (err, new_user) {
    console.log("Save user result: ", err);
    if (err) {
      return res.render('users/signup', {
        errors: errorHelper.proper(err.errors),
        user: user,
        title: 'Sign up'
      })
    } else {
      console.log(user)
      // manually login the user once successfully signed up
      req.logIn(user, function (err) {
        if (err) {
          console.log(err)
          return next(err)
        }
        return res.redirect('/dashboard')
      })
    }
  })
};

/*
 * list
 */
exports.init = function (req, res) {
  for (var i = 0; i < 100; i++) {
    var U = new User({ email: "mail" + i + "@163.com", username: "user " + i });
    U.password = '123456';
    U.save(function (err, obj) {
      if (err) {
        console.log(err);
      }
    });
    console.log("User " + U + " created.");
  }
  res.send("init ok.");
};


/*
 * list
 */
exports.list = function (req, res) {
  new User().findUserAndRole(req, res);
};

/*user list table json datasource*/
exports.datatable = function (req, res) {
  User.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};


exports.add = function (req, res) {
  Role.find(function (err, roles) {
    res.render('system/user/userForm', {
      viewType: "add",
      user: new User(),
      roles: roles
    })
  });
};

exports.edit = function (req, res) {
  var id = req.param("id");
  User.findById({ '_id': id }, function (err, user) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/system/user');
    } else {
      Role.find(function (err, roles) {
        res.render('system/user/userForm', {
          viewType: "edit",
          user: user,
          roles: roles
        })
      });
    }
  });
};


exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  User.remove({ '_id': ids }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/user');
    }
  });

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
    User.count({ username: newName }, function (err, result) {
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
var save = function (req, res) {
  var id = req.body.id;
  // handle checkbox unchecked.Å
  if (!req.body.enabled) req.body.enabled = false;

  if (!id) {
    var user = new User(req.body);
    user.save(function (err, newUser) {
      handleSaved(req, res, err, newUser, 'add');
    });
  } else {
    // update
    User.findByIdAndUpdate({ '_id': id }, req.body, function (err, user) {
      handleSaved(req, res, err, (err ? req.body : user), 'edit');
    });
  }
};
exports.save = save;
// handle object saved
function handleSaved(req, res, err, user, type) {
  if (err) {
    console.log(err);
    req.flash('error', '用户保存失败!');
    res.render('system/user/userForm', {
      viewType: type,
      user: user
    });
  } else {
    var roleId = req.body.roles;
    console.log("Roles:" + roleId);

    user.roles = roleId;
    user.save();
    //user.addRole(roleId);
    req.flash('success', '用户保存成功!');
    res.redirect('/system/user');
  }
}

/**
 * 修改用户资料
 * @param req
 * @param res
 */
exports.updateProfile = function (req, res) {
  var id = req.body.id;
  console.log(req.body);
  if (id) {
    // update
    User.update({ '_id': id }, req.body, function (err, result) {
      console.log(err);
      console.log(result);
      if (err) {
        res.send({ success: false, msg: err });
      } else {
        res.send({ success: true, msg: '保存个人资料成功' });
      }
    });
  }
};

/**
 * 验证用户密码
 * @param req
 * @param res
 */
exports.virtualPwd = function (req, res) {
  var id = req.user._id;
  var pwd = req.param("oldPwd");
  User.findById(id, function (err, user) {
    if (!user || !user.authenticate(pwd)) {
      console.log("输入的原密码不正确");
      res.send('false');
    } else {
      console.log("输入的原密码正确");
      res.send('true');
    }
  });
};
/**
 * 修改用户密码
 * @param req
 * @param res
 */
exports.editPassword = function (req, res) {
  var id = req.user._id;
  var oldPwd = req.body.oldPwd;
  var newPwd = req.body.newPwd;
  var affirmPwd = req.body.affirmPwd;
  console.log(req.body);
  if (id) {
    User.findOne({ _id: id }, function (err, user) {
      if (!user || !user.authenticate(oldPwd)) {
        req.flash("error", "输入的原密码不正确");
        res.redirect('/' + req.user.username);
      } else {
        if (newPwd === affirmPwd) {
          var pwd = user.encryptPassword(newPwd);
          var updata = { hashed_password: pwd };
          var options = {};
          User.update({ _id: id }, updata, options, function (err, ff) {
            req.flash("success", "密码已修改,请重新登录！");
            res.redirect('/login');
          });
        } else {
          req.flash("error", "新密码和确认密码不一致");
          res.redirect('/' + req.user.username);
        }
      }
    });
  } else {
    req.flash("error", "没有查到用户");
    res.redirect('/' + req.user.username);
  }
};
//获得具体分组情况
exports.getRoleSelect = function (req, res) {
  Role.find({}, function (err, group) {
    if (err) {
      console.log(err);
    } else {
      res.send(group);
    }
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
  User.findOne({ '_id': id }, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      User.update({ '_id': id }, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/user');
        }
      });
    }
  });
};

/**
 * 重置用户密码
 * @param req
 * @param res
 */
exports.resetPassword = function (req, res) {
  var id = req.user._id;
  var oldPwd = req.body.oldPwd;
  console.log(req.body);
  if (id) {
    User.findOne({ _id: id }, function (err, user) {
      if (!user || !user.authenticate(oldPwd)) {
        req.flash("error", "输入的原密码不正确");
        res.redirect('/' + req.user.username);
      } else {
        var pwd = user.encryptPassword('123456');
        var updata = { hashed_password: pwd };
        var options = {};
        User.update({ _id: id }, updata, options, function (err, ff) {
          req.flash("success", "密码已重置“123456”,请重新登录修改密码！");
          res.redirect('/login');
        });

      }
    });
  } else {
    req.flash("error", "没有找到用户");
    res.redirect('/' + req.user.username);
  }
};
/**
 * 注册
 * @param req
 * @param res
 */
exports.register = function (req, res) {
  var channelUser = new User(req.body);
  channelUser.isAdmin = true;
  channelUser.save(function (err, result) {
    if (err) {
      console.log(err);
      console.log("数据添加失败！");
      req.flash('error', '添加失败!');
      res.redirect("/register")
    } else {
      req.flash('success', '注册成功!');
      res.redirect("/");
    }
  });
};

exports.sentValid = function (req, res) {
  var mobile = req.query.mobile;
  sendSMS(req, res, mobile, null, null, "register");
};

exports.checkCode = function (req, res) {
  var mobile = req.query.mobile;
  var code = req.query.code;
  console.log("mobile", "=========================>", mobile);
  console.log("code", "=========================>", code);
  CheckCode.findOne({
    'mobile': mobile,
    'type': 'register',
    'used': false
  }, function (err, checkCode) {
    console.log("checkCode", "=========================>", checkCode);
    if (!checkCode) {
      res.send({
        "success": '0',
        msg: "该手机没有被注册"
      })
    } else {
      if (checkCode.code == code) {
        checkCode.used = true;
        checkCode.usingAt = new Date();
        checkCode.save(function (err, result) {
          res.send({
            "success": '1',
            msg: "success"
          })
        })
      } else {
        res.send({
          "success": '0',
          msg: "验证码错误"
        })
      }
    }
  });
};

exports.checkUsername = function (req, res) {
  var username = req.query.username;
  User.count({
    username: username
  }, function (err, result) {
    if (result > 0) {
      res.send('false');
    } else {
      res.send('true');
    }
  });
};

exports.resetPwd = function (req, res) {
  res.render('resetPass/resetPwd', {});
};

/**
 * 通过手机找回密码
 * @param req
 * @param res
 */
exports.resetBySMS = function (req, res) {
  var mobile = req.body.value;
  var username = req.body.username;
  console.log("mobile", "=========================>", mobile);
  console.log("username", "=========================>", username);
  User.count({
    mobile: mobile,
    "username": username
  }, function (err, result) {
    console.log("result", "=========================>", result);
    if (result > 0) {
      sendSMS(req, res, mobile, 'resetPass/checkValid', username, "resetPwd");
    } else {
      req.flash('error', '用户名或者手机号不正确!');
      res.redirect("/user/resetPwd");
    }
  });
};

/**
 * 通过邮件找回密码
 * @param req
 * @param res
 */
exports.resetByEmail = function (req, res) {
  var email = req.body.value;
  var username = req.body.username;
  console.log("email", "=========================>", email);
  console.log("username", "=========================>", username);
  User.count({
    email: email,
    "username": username
  }, function (err, result) {
    console.log("result", "=========================>", result);
    if (result > 0) {
      sendEmail(email, function (err) {
        if (err) {
          req.flash('error', err);
          res.redirect("/user/resetPwd");
        } else {
          res.render('resetPass/checkValid', {
            "success": '1',
            msg: "success",
            "mobile": email,
            "username": username,
            "type": "email"
          });
        }
      })
    } else {
      req.flash('error', '用户名或者手机号不正确!');
      res.redirect("/user/resetPwd");
    }
  });
};
/**
 *  Show profile
 */
exports.profile = function (req, res, next) {
  var username = req.params.username;

  async.waterfall([
    function (callback) {
      if (req.user) {
        if (username === req.user.username) {
          callback(null, req.user)
        } else {
          User.findOne({ username: username }, function (err, user) {
            callback(err, user)
          })
        }
      } else {
        User.findOne({ username: username }, function (err, user) {
          callback(err, user)
        })
      }
    }], function (err, user) {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (!user) {
        res.render('404', { url: req.url, error: '404 Not found' });

      } else {
        if (user.photo_profile === undefined) {
          //user.photo_profile = 'https://gravatar.com/avatar/' + utility.md5(user.email) + '?s=200&d=retro'
          user.photo_profile = '';

        }
        res.render('users/profile', {
          title: user.name,
          user: user
        })
      }

    })
};
exports.checkValid = function (req, res) {
  var mobileNo = req.body.mobileNo;
  var username = req.body.username;
  var value = req.body.value;
  var type = req.body.type;
  console.log("mobile", "=========================>", mobileNo);
  console.log("code", "=========================>", value);
  console.log("type", "=========================>", type);

  var typeStr = "";
  if (type == "sms") {
    typeStr = "手机";
  } else {
    typeStr = "邮箱";
  }
  CheckCode.findOne({
    'mobile': mobileNo,
    'type': 'resetPwd',
    'used': false
  }, function (err, checkCode) {
    console.log("checkCode", "=========================>", checkCode);
    if (checkCode) {
      if (checkCode.code == value) {
        checkCode.used = true;
        checkCode.usingAt = new Date();
        checkCode.save(function (err, result) {
          res.render("resetPass/changePwd", {
            "success": '1',
            msg: "success",
            "type": type,
            "mobile": mobileNo,
            "username": username
          });
        })
      } else {
        req.flash('error', '验证码错误');
        res.render('resetPass/checkValid', {
          "success": '1',
          msg: "success",
          "mobile": mobileNo,
          "username": username,
          "type": type
        });
      }
    } else {
      req.flash('error', '未下发验证码到此' + typeStr + '!');
      res.redirect("/user/resetPwd");
    }
  });
};

exports.changePwd = function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var mobile = req.body.mobileNo;
  var type = req.body.type;
  var query = new Object();
  if (type == "sms") {
    query = {
      "username": username,
      "mobile": mobile
    };
  } else {
    query = {
      "username": username,
      "email": mobile
    };
  }
  User.findOne(query, function (err, user) {
    user.password = password;
    user.save(function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', '添加失败!');
      } else {
        req.flash('success', '注册成功!');
        res.redirect("/");
      }
    })
  })

};

//  normal users
exports.apply = function (req, res) {
  res.render('users/register', {
    user: new User({
      username: '',
      email: '',
      mobile: ''
    })
  });
};


function getValidCode() {
  var num = "";
  for (var i = 0; i < 6; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
}

function sendSMS(req, res, mobile, url, username, type) {

  Setting.findOne({
    'key': 'sms'
  }, function (err, setting) {
    if (setting) {
      var value = setting.value;
      SmsSetting.findOne({
        'name': value
      }, function (err, sms) {

        var smsParam = new Object();
        sms.params.forEach(function (item) {
          smsParam[item.paramName] = item.paramValue;
        });
        smsParam.code = getValidCode();
        //res.send({"success":'1', msg: "success", validCode: smsParam.code})
        smsUtil.sendSmsMsg(mobile, smsParam, null, function (err, result) {
          if (err) {

            console.log("sms send error", "=========================>", {
              "success": '0',
              msg: err
            });

            req.flash('error', "触发业务流控");
            if (type == "resetPwd") {
              res.redirect("/user/resetPwd");
            } else {
              res.redirect("/register")
            }
          } else {
            CheckCode.findOne({
              'mobile': mobile,
              'type': 'register',
              'used': false
            }, function (err, code) {
              if (!code) {
                code = new CheckCode();
                code.mobile = mobile;
                code.type = type;
                code.code = smsParam.code;
                code.createdAt = new Date();
                code.used = false;
              } else {
                code.code = smsParam.code;
              }
              code.save(function (err, result) {

                console.log("sms send success", "=========================>", {
                  "success": '1',
                  msg: "success",
                });

                if (url) {
                  res.render(url, {
                    "success": '1',
                    msg: "success",
                    "mobile": mobile,
                    "username": username,
                    "type": "sms"
                  });
                } else {
                  res.send({
                    "success": '1',
                    msg: "success",
                    "mobile": mobile
                  });
                }
              });
            });
          }
        });
      })
    } else {
      req.flash('error', "未找到默认短信配置");
      if (type == "resetPwd") {
        res.redirect("/user/resetPwd");
      } else {
        res.redirect("/register")
      }
    }
  });
}

function sendEmail(email, callback) {

  Setting.findOne({
    'key': 'email'
  }, function (err, setting) {
    if (setting) {
      var value = setting.value;
      SmsSetting.findOne({
        'name': value
      }, function (err, sms) {
        var smsParam = new Object();
        sms.params.forEach(function (item) {
          smsParam[item.paramName] = item.paramValue;
        });
        console.log("smsParam", "=========================>", JSON.stringify(smsParam));

        var smtpTransport = nodemailer.createTransport("SMTP", {
          host: smsParam.host, // 主机
          secureConnection: smsParam.secureConnection == 'true' ? true : false, // 使用 SSL
          port: smsParam.port, // SMTP 端口
          auth: {
            user: smsParam.user, // 账号
            pass: smsParam.pass // 密码
          }
        });

        var validCode = getValidCode();

        var mailOptions = {
          from: "九宫格系统管理员 <" + smsParam.user + ">", // 发件地址
          to: email, // 收件列表
          subject: "九宫格-重置密码验证码（请不要答复此邮件)", // 标题
          html: "亲爱的九宫格用户，<br><br>" +
          "您好！您的验证码是：<span style='color: red'>" + validCode + "</span><br>" +
          "本邮件是系统自动发送的，请勿直接回复！如请求并非本人发出,请勿理睬!感谢您的访问，祝您使用愉快！<br><br>" +
          "九宫格" // html 内容
        };

        console.log("mailOptions", "=========================>", mailOptions);

        // 发送邮件
        smtpTransport.sendMail(mailOptions, function (error, response) {
          if (error) {
            console.log(error);
          } else {
            console.log("Message sent: " + response.message);

            CheckCode.findOne({
              'mobile': email,
              'type': 'register',
              'used': false
            }, function (err, code) {
              if (!code) {
                code = new CheckCode();
                code.mobile = email;
                code.type = 'resetPwd';
                code.code = validCode;
                code.createdAt = new Date();
                code.used = false;
              } else {
                code.code = smsParam.code;
              }
              code.save(function (err, result) {
                callback(null);
              });
            });
          }
          smtpTransport.close(); // 如果没用，关闭连接池
        });

      });
    } else {
      callback("未找到默认邮件配置");
    }

  });
}
