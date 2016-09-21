/**
 * Created by Renee on 2016/5/5.
 */

var mongoose = require('mongoose')
  , MemberGroup = mongoose.model('MemberGroup')
  , config = require('../../config/config');


exports.groupList = function (req, res) {
  MemberGroup.find({}, function (err, datas) {
    res.render('member/group/groupList', {
      users: datas
    })
  })
};

exports.datatable = function (req, res) {
  var channelId = req.user.channelId;
  MemberGroup.dataTable(req.query, {conditions: {channel: channelId}}, function (err, data) {
    if (data) {
      res.send(data);
    }
  });
};

exports.edit = function (req, res) {
  var id = req.param("id");
  MemberGroup.findOne({'_id': id}, function (err, group) {
    if (err) {
      req.flash('error', err);
      res.redirect('/member/group/list/');
    }
    else if (!group) {
      req.flash('error', '该类不存在');
      res.redirect('/member/group/list/');
    } else {
      res.render('member/group/groupForm', {
        // viewType: "edit",
        group: group
      })
    }
  });
};

exports.add = function (req, res) {
  res.render('member/group/groupForm', {
    //viewType: "add",
    group: new MemberGroup()
  })
};

exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    MemberGroup.count({name: newName}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.getAllGroup = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  MemberGroup.find({}, function (err, group) {
    if (err) {
      console.log(err);
    } else {
      res.send(group);
    }
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  MemberGroup.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/member/group/list/');
    }
  });

};

exports.save = function (req, res) {
  var id = req.body.id;
  // update
  var used = req.body.used;
  if (used != 'true') {
    req.body.used = false;
  } else {
    req.body.used = true;
  }
  if (!id) {
    var group = new MemberGroup(req.body);
    group.save(function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err.message);
      } else {
        req.flash('success', '添加成功!');
      }
      res.redirect('/member/group/list/');
    });
  } else {
    MemberGroup.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err.message);
      } else {
        req.flash('success', '保存成功!');
      }
      res.redirect('/member/group/list/');
    });
  }

};

exports.setGroup = function (req, res) {
  var ids = req.param("Ids");
  if (ids && ids != null) {
    ids = ids.split(",");
  }
  var groupId = req.param("groupName");
  var update = {"MemberGroup": groupId};
  var options = {}
  /*WechatFans.find({'_id': {$in: ids}}, function (err, datas) {
   datas.forEach(function (fans) {
   WechatFans.update({_id: fans._id}, update, options, function (err, docs) {
   if (err) {
   console.log(err);
   }
   });
   });
   res.send("分组已设置");
   });*/
};
