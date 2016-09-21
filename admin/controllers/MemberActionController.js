/**
 * Created by xingjie201 on 2016/3/28.
 */

var mongoose = require('mongoose')
  , MemberAction = mongoose.model('MemberAction')
  , MemberScore = mongoose.model('MemberScore')
  , config = require('../../config/config');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
var excal = require('excel-export');
var fs = require('fs');


/*
 * list
 */
exports.list = function (req, res) {
  res.render('member/memberActionList', {
    action: null
  })
};

/*user list table json datasource*/
exports.datatable = function (req, res) {
  var channelId = req.user.channelId;
  MemberAction.dataTable(req.query, { conditions: { channel: channelId } }, function (err, data) {
    res.send(data);
  });
};
/*user list table json datasource*/
exports.datatables = function (req, res) {
  MemberAction.dataTable(req.query, { conditions: { channel: null } }, function (err, data) {
    res.send(data);
  });
};
/*user list table json datasource*/
exports.datatableScore = function (req, res) {
  var memberId = req.query.memberId || req.body.memberId;
  var channel = req.user.channelId;
  if (memberId) {
    MemberScore.dataTable(req.query, { conditions: { 'channel': channel, 'member': memberId } }, function (err, data) {
      res.send(data);
    });
  } else {
    MemberScore.dataTable(req.query, { conditions: { 'channel': channel, 'member': null } }, function (err, data) {
      res.send(data);
      console.log("datatableScore================>>", "memberId没有值");
    });
  }
};

/**
 * 添加积分行为
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('member/memberActionForm', {
    action: new MemberAction()
  })
};
/**
 * 编辑积分行为
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id || req.query.id;
  MemberAction.findById({ '_id': id }, function (err, action) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/member/action/list');
    } else {
      res.render('member/memberActionForm', {
        action: action
      })
    }
  });
};

/**
 * 删除积分行为
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  MemberAction.remove({ '_id': ids }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/member/action/list');
    }
  });

};

/**
 * 设置渠道中的行为，将系统中的预设规则复制一份到渠道行为中
 * @param req
 * @param res
 */
exports.setAction = function (req, res) {
  var actionIds = req.body.actionIds || req.params.actionIds;
  var channelId = req.user.channelId;
  var ids = actionIds.split(",");
  MemberAction.find({ '_id': { $in: ids } }, function (err, actions) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      actions.forEach(function (e) {
        MemberAction.count({ channel: channelId, name: e.name, code: e.code }, function (err, ac) {
          if (ac == 0) {
            var ac = {
              channel: channelId,
              code: e.code,      //积分行为标识
              name: e.name,      //积分行为名称
              score: e.score,    //积分值，可正负
              description: e.description
            };
            var action = new MemberAction(ac);
            action.save(function (err, a) {
              if (err) {
                console.log(err);
              }
            });
          }
        });
      });
      req.flash('success', '设置成功，已经配置过的行为不会保存!');
      res.redirect('/member/action/list');
    }
  });

};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
var save = function (req, res) {
  var id = req.body.id;
  if (!id) {
    var action = new MemberAction(req.body);
    action.channel = req.user.channelId;
    action.save(function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/member/action/list');
    });
  } else {
    // update
    MemberAction.update({ '_id': id }, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/member/action/list');
    });
  }
};
exports.save = save;

/**
 * 检查名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var name = req.query.name || req.body.name;
  var oldName = req.query.oldName || req.body.oldName;
  if (name == oldName) {
    res.send('true');
  } else {
    var channelId = req.user.channelId;
    MemberAction.count({ 'channel': channelId, 'name': name }, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};
/**
 * 检查标识是否已经存在^
 */
exports.checkCode = function (req, res) {
  var code = req.query.code || req.body.code;
  var oldCode = req.query.oldCode || req.body.oldCode;
  if (code == oldCode) {
    res.send('true');
  } else {
    var channelId = req.user.channelId;
    MemberAction.count({ 'channel': channelId, 'code': code }, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};
