/**
 * Created by xingj on 2016/8/22.
 */
/**
 * Created by danne on 2015/10/29.
 */
"use strict";

var mongoose = require('mongoose');
var BranchMessage = mongoose.model('BranchMessage');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');
/*
 * list
 */
exports.list = function (req, res) {
  res.render('bank/branch/messageList');
};

/*
 * list
 */
exports.init = function (req, res) {
  for (var i = 0; i < 10; i++) {
    var message = new BranchMessage();
    message.channel = req.session.channelId;
    message.branch = i / 2 == 0 ? "57bac09e196cd5400e6fa980" : "5751434bae64826e616374ff";
    message.datetime = new Date();
    message.message = "无法幸福吧！我有点多愁善感，因为就我一个人躺着";
    message.feedback = "你看那山野中开满的菊花，你的笑容让他们羞涩枯萎";
    message.datetime = new Date();
    var user = {};
    user.mobile = '13585509783';
    user.fullname = '你大爷！';
    message.user = user;
    message.save(function (err, message) {
      console.log(message);
    });
  }
  res.send("jdddddddddddddddd");
};
/**
 * 回复留言信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id || req.body.id;
  BranchMessage.findById({_id: id}, function (err, message) {
    if (message) {
      BranchMessage.update({_id: message._id}, {isReaded: true}, function (err, result) {
        console.log("message====================", message);
        res.render('bank/branch/messageForm', {message: message});
      });
    } else {
      req.flash('error', '数据查找失败!');
      res.redirect('/bank/message/list');
    }
  });
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  var branch = req.query.branch;
  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var isReaded = req.query.isReaded;
  var query = {};

  if (branch) {
    query.branch = branch;
  }
  if (fullname) {
    var name = {'user.fullname': {$regex: fullname}};
    query = _.assign(query, name);
  }
  if (mobile) {
    var name = {'user.mobile': mobile};
    query = _.assign(query, name);
  }
  if (isReaded) {
    query.isReaded = true;
  }else{
    query.isReaded = false;
  }
  query.channel = req.session.channelId;
  BranchMessage.dataTable(req.query, {conditions: query}, function (err, data) {
    res.send(data);
  });
};
/**
 * 导出预约信息
 * @param req
 * @param res
 */
exports.export = function (req, res) {
  var branch = req.query.branch;
  var fullname = req.query.fullname;
  var mobile = req.query.mobile;
  var query = {};
  if (branch) {
    query.branch = branch;
  }
  if (fullname) {
    var name = {'user.fullname': {$regex: fullname}};
    query = _.assign(query, name);
  }
  if (mobile) {
    var name = {'user.mobile': mobile};
    query = _.assign(query, name);
  }
  query.channel = req.session.channelId;

  var label = "网点" + "," + "	用户名" + "," + "手机号" + "," + "留言" + "," + "留言时间" + "," + "反馈内容" + ","+ "是否已读" + "," + "是否处理" + "\n";

  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  getData(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "messageUser" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(label);
  })
};

/**
 * 获取预约信息返回数据
 * @param query 查询数据的条件
 * @param callback
 */
function getData(query, callback) {
  //var
  BranchMessage.find(query).populate([{"path": "branch", "select": "name"}]).sort({'datetime': 1}).exec(function (err, message) {
    if (message && message.length > 0) {
      var bufs = "";
      message.forEach(function (e) {
        var fullname = e.user.fullname ? e.user.fullname : " ";
        var mobile = e.user.mobile ? e.user.mobile : " ";
        var brachName = e.branch ? e.branch.name : "";
        var message = e.message;
        var datetime = moment(e.datetime).format("YYYY-MM-DD HH:mm:ss")
        var feedback = e.feedback;
        var isReaded = e.isReaded ? "已读" : "未读";
        var isHandle = e.isHandle ? "已处理" : "未处理";
        bufs += brachName + "," + fullname + "," + mobile + "\t," + message + "," + datetime + "\t," + feedback + ","+ isReaded + "," + isHandle + "\n";
      });
      callback(null, bufs);
    } else {
      callback(err, null);
    }
  });
}

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  BranchMessage.findById(ids,function(err,msg){
    if(msg.isHandle){
      BranchMessage.remove({'_id': ids}, function (err, result) {
        if (err) {
          console.log(err);
          req.flash('error', err);
        } else {
          req.flash('success', '数据删除成功!');
          res.redirect('/bank/message/list');
        }
      });
    }else{
      req.flash('error', '未处理的留言不可删除!');
      res.redirect('/bank/message/list');
    }

  });


};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.serverName;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    BranchMessage.count({name: newName}, function (err, result) {
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
exports.feedback = function (req, res) {

  var id = req.body.id;
  var feedback = req.body.feedback;
  var isDisplay = req.body.isDisplay;
  if (!isDisplay) isDisplay = false;
  console.log(id);
  if (id) {
    BranchMessage.update({'_id': id}, {
      feedback: feedback,
      isDisplay: isDisplay,
      isHandle: true
    }, function (err, result) {
      if (err) {
        console.error(err);
        req.flash('error', '处理失败！');
        res.redirect('/bank/message/list');
        return;
      }
    });
  }
  req.flash('success', '处理成功!');
  res.redirect('/bank/message/list');
};
