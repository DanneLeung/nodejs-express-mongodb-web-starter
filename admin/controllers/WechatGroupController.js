/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose')
  , WechatGroup = mongoose.model('WechatGroup')
  , WechatFans = mongoose.model('WechatFans')
  , config = require('../../config/config');


exports.groupList = function (req, res) {
  var type = req.params.type || req.body.type;
  WechatGroup.find({}, function (err, datas) {
    res.render('wechat/group/groupList', {
      users: datas,
      type: type
    })
  })
}

exports.datatable = function (req, res) {
  WechatGroup.dataTable(req.query, function (err, data) {
    res.send(data);
  });
}

/**
 * 添加用户分组
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  var type = req.params.type || req.body.type;
  res.render('wechat/group/groupForm', {
   // viewType: "add",
    group: new WechatGroup(),
    type: type
  })
};

/**
 * 编辑分组功能
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.param("id");
  var type = req.params.type || req.body.type;
  WechatGroup.findOne({'_id': id}, function (err, group) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/member/group/list/' + type);
    } else {
      res.render('wechat/group/groupForm', {
        //viewType: "edit",
        group: group,
        type: type
      })
    }
  });
};

/**
 * 删除微信粉丝分组
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  var type = req.params.type || req.body.type;
  WechatGroup.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/member/group/list/' + type);
    }
  });

};

/**
 * 获取所有的微信粉丝分组
 * @param req
 * @param res
 */
exports.getAllGroup = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  WechatGroup.find({}, function (err, group) {
    if (err) {
      console.log(err);
    } else {
      res.send(group);
    }
  });
};
/**
 * 为选中的微信粉丝分组
 * @param req
 * @param res
 */
exports.setGroup = function (req, res) {
  var ids = req.param("Ids");
  if (ids && ids != null) {
    ids = ids.split(",");
  }
  var groupId = req.param("groupName");
  var update = {"wechatGroup": groupId};
  var options = {}
  WechatFans.find({'_id': {$in: ids}}, function (err, datas) {
    datas.forEach(function (fans) {
      WechatFans.update({_id: fans._id}, update, options, function (err, docs) {
        if (err) {
          console.log(err);
        }
      });
    });
    res.send("分组已设置");
  });
};

/**
 * 检查卡号是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    WechatGroup.count({name: newName}, function (err, result) {
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
  var type = req.params.type || req.body.type;
  // update
  var used = req.body.used;
  if (used != 'true') {
    req.body.used = false;
  } else {
    req.body.used = true;
  }
  if (!id) {
    var group = new WechatGroup(req.body);
    group.save(function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err.message);
      } else {
        req.flash('success', '添加成功!');
      }
      res.redirect('/member/group/list/' + type);
    });
  } else {
    WechatGroup.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err.message);
      } else {
        req.flash('success', '保存成功!');
      }
      res.redirect('/member/group/list/' + type);
    });
  }

};

