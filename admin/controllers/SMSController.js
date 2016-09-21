/**
 * Created by yu869 on 2016/3/21.
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;
var SmsSetting = mongoose.model('SmsSetting');
var ChannelSMS = mongoose.model('ChannelSMS');
var Channel = mongoose.model('Channel');

var moment = require('moment');

exports.smsSetting = function (req, res) {
  res.render('system/sms/smsList');
};

exports.smsDataTable = function (req, res) {
  var name = req.query.name;
  var enable = req.query.enable;

  console.log("name", "==========================>", name);
  console.log("enable", "==========================>", enable);

  var querys = {};//添加条件
  if (name != "" && name != undefined) {
    querys.name = {$regex: name};//会员名称
  }
  if (enable != "" && enable != undefined) {
    querys.enable = {$regex: enable};//会员手机号
  }
  if (req.user) {
    querys.channelId = req.user.channelId;//会员所属渠道
    ChannelSMS.dataTable(req.query, {conditions: querys}, function (err, data) {
      res.send(data);
    });
  } else {
    req.flash('error', "请先登录");
    res.send("");
  }
};

exports.smsAdd = function (req, res) {
  SmsSetting.find({'enabled':true,'type':'01'},function(err,smss){
    res.render('system/sms/smsForm', {
      sms: new ChannelSMS(),
      smss:smss
    });

  });
};

function changeToArray(Object) {
  if (Object instanceof Array) {
    return Object;
  } else {
    return new Array(Object);
  }
}

exports.smsDel = function (req, res) {
  var id = req.body.ids;
  ChannelSMS.remove({'_id': id}, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/system/sms');
    }
  });
};

exports.smsEnableOrDisable = function (req, res) {
  var id = req.body.ids;
  ChannelSMS.findOne({'_id': id}, function (err, sms) {
    var enable = sms.enable;
    if (enable == '01') {
      enable = '00';
    } else {
      enable = '01';
    }
    sms.enable = enable;
    sms.save(function (err, o) {
      res.redirect('/system/sms');
    })
  });
};

exports.smsEdit = function (req, res) {
  var id = req.params.id;
  var type = req.query.type;
  ChannelSMS.findOne({'_id': id}, function (err, sms) {
    if (err) {
      console.log(err);
    } else {
      console.log("Channel SMS: " + sms);
      res.render('system/sms/smsEditForm', {
        viewType: type ? type : "edit",
        sms: sms
      });
    }
  });
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
  ChannelSMS.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      ChannelSMS.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/sms');
        }
      });
    }

  });
};


exports.getEnableSms = function (req, res) {
  SmsSetting.find({'enable': '01'}, function (err, smss) {
    res.send(smss);
  })
};

exports.getCanModifyParams = function (req, res) {
  var id = req.query.id;

  SmsSetting.findOne({'_id': id}, function (err, sms) {
    if (err) {
      console.log(err);
    } else {
      var params = [];
      if (sms) {
        sms.params.forEach(function (item) {
            params.push(item);
        })
      }
      res.send(params)
    }
  });
};

exports.checkSmsExist = function (req, res) {
  var smsMethod = req.query.smsMethod;
  console.log("check exist", "===================>", smsMethod);
  SmsSetting.findOne({'_id': smsMethod}, function (err, sms) {
    ChannelSMS.count({name: sms.name}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });

  });
};

exports.save = function (req, res) {
  var id = req.body.smsMethod;
  console.log("id", "==========================>", id);

  SmsSetting.findOne({'_id': id}, function (err, sms) {
    if (err) {
      console.log(err);
    } else {
      if (sms) {
        var channelSMS = new ChannelSMS();
        channelSMS.name = sms.name;
        channelSMS.type = sms.type;
        channelSMS.description = sms.description;
        channelSMS.enable = req.body.enable;

        var channelId = req.user.channelId;
        if (!channelId) {
          req.flash('error', '请先登录!');
          res.redirect('/');
        } else {
          channelSMS.channelId = channelId;

          console.log("channelId", "==========================>", channelId);

          var params = new Array();
          sms.params.forEach(function (item) {
            if (item.isChecked == '01') {
              var paramId = item._id;
              item.paramValue = req.body[paramId];
              item._id = "";
              params.push(item);
            } else {
              item._id = "";
              params.push(item);
            }
          });
          channelSMS.params = params;
          channelSMS.save(function (err, result) {
            if (err) {
              console.log(err);
            } else {
              res.redirect('/system/sms');
            }
          });
        }
      }
    }
  });
};

exports.saveEdit = function (req, res) {
  var id = req.body.id;
  ChannelSMS.findOne({'_id': id}, function (err, sms) {
    if (err) {
      console.log(err);
    } else {
      if (sms) {
        sms.enable = req.body.enable;
        sms.description = req.body.description;
        var params = new Array();
        sms.params.forEach(function (item) {
          if (item.isChecked == '01') {
            var paramId = item._id;
            item.paramValue = req.body[paramId];
            params.push(item);
          } else {
            params.push(item);
          }
        });
        sms.params = params;

        sms.save(function (err, result) {
          if (err) {
            console.log(err);
          } else {
            res.redirect('/system/sms');
          }
        });
      }
    }
  });
};
