/**
 * 渠道用户组
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var _ = require("lodash");

/**
 * 渠道用户分组
 * @type {Schema}
 * @param {name:分组名称}
 * @param {menus:内联文档}
 */
var ChannelUserGroupSchema = mongoose.Schema({
  name: {type: String, required: true, default: ''},
  description: {type: String, default: ''},
  channel: {type: ObjectId, ref: "Channel"},    //渠道Id
  enabled: {type: Boolean, default: true},
  menus: [{type: ObjectId, ref: 'Menu'}]
}, {timestamps: {}});


function doCan(type, actionsAndSubjects, done) {
  var group = this;
  group.populate('menus', function (err, group) {
    if (err) return done(err);
    var count = 0, hasAll = false;
    if (group.menus) {
      actionsAndSubjects.forEach(function (as) {
        var has = false;
        group.menus.forEach(function (p) {
          if (p.action === as[0] && p.subject === as[1]) has = true;
        });
        if (has) count++;
      });
    }
    if (type === CAN_ANY) {
      hasAll = (count > 0);
    }
    else {
      hasAll = (count === actionsAndSubjects.length);
    }
    done(null, hasAll);
  });
}

//RoleSchema.statics.menus = function (id, done) {
//  mongoose.model('ChannelUserGroup').findById(id, function (err, group) {
//    group.populate('menus', function (err, r) {
//      done(r.menus);
//    });
//  });
//};


ChannelUserGroupSchema.statics = {
  menus: function (id, done) {
    mongoose.model('ChannelUserGroup').findById(id, function (err, group) {
      group.populate('menus', function (err, r) {
        done(r.menus);
      });
    });
  },
  addPermissions: function (id, menuIds, done) {
    mongoose.model('ChannelUserGroup').findById(id, function (err, group) {
      //权限先合并再排除相同值的权限id
      group.menus = _.uniq(_.union(group.menus, menuIds), function (p) {
        //字符串比较
        return p + "";
      });
      group.save(function (err, group) {
        done(err, group);
      });
    });
  },
  revokePermissions: function (id, menuIds, done) {
    mongoose.model('ChannelUserGroup').findById(id, function (err, group) {
      console.log("final menus:\n" + menuIds);
      // 去除选择解除权限的权限ID
      group.menus = _.remove(group.menus, function (n) {
        var idx = menuIds.some(function (p) {
          //字符串比较
          return p == n + "";
        });
        return !(menuIds == n + "" || idx);
      });
      group.save(function (err, group) {
        done(err, group);
      });
    });
  },
  //检测是否已经被赋予角色
  can: function (action, subject, done) {
    mongoose.model('ChannelUserGroup').findById(this._id, function (err, group) {
      if (err) return done(err);
      doCan.call(group, CAN_ALL, [[action, subject]], done);
    });
  },

  //检测是否已经被赋予全部角色
  canAll: function (actionsAndSubjects, done) {
    mongoose.model('ChannelUserGroup').findById(this._id, function (err, group) {
      if (err) return done(err);
      doCan.call(group, CAN_ALL, actionsAndSubjects, done);
    });
  },

  //检测是否已经被赋予任何一个角色
  canAny: function (actionsAndSubjects, done) {
    mongoose.model('ChannelUserGroup').findById(this._id, function (err, group) {
      if (err) return done(err);
      doCan.call(group, CAN_ANY, actionsAndSubjects, done);
    });
  }
};

module.exports = mongoose.model('ChannelUserGroup', ChannelUserGroupSchema, 'channelusergroups');

