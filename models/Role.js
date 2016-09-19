/**
 * Created by JiBingKun on 2015/7/40.
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var _ = require("lodash");

/**
 * 角色
 * @type {Schema}
 * @param {name:角色名称}
 * @param {permissions:内联文档}
 */
var RoleSchema = mongoose.Schema({
  name: {type: String, required: true, default: ''},
  description: {type: String, default: ''},
  permissions: [{type: ObjectId, ref: 'Permission'}]
}, {timestamps: {}});


RoleSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Role').findOne({name: that.name}, function (err, role) {
    if (err) {
      done(err);
    }
    else if (role && !(role._id.equals(that._id))) {
      that.invalidate('name', 'name must be unique');
      done(new Error('Role name must be unique'));
    }
    else {
      done();
    }
  });
});

function doCan(type, actionsAndSubjects, done) {
  var role = this;
  role.populate('permissions', function (err, role) {
    if (err) return done(err);
    var count = 0, hasAll = false;
    if (role.permissions) {
      actionsAndSubjects.forEach(function (as) {
        var has = false;
        role.permissions.forEach(function (p) {
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

//RoleSchema.statics.permissions = function (id, done) {
//  mongoose.model('Role').findById(id, function (err, role) {
//    role.populate('permissions', function (err, r) {
//      done(r.permissions);
//    });
//  });
//};


RoleSchema.statics = {
  permissions: function (id, done) {
    mongoose.model('Role').findById(id, function (err, role) {
      role.populate('permissions', function (err, r) {
        done(r.permissions);
      });
    });
  },
  addPermissions: function (id, permissionIds, done) {
    mongoose.model('Role').findById(id, function (err, role) {
      //权限先合并再排除相同值的权限id
      role.permissions = _.uniq(_.union(role.permissions, permissionIds), function (p) {
        //字符串比较
        return p + "";
      });
      role.save(function (err, role) {
        done(err, role);
      });
    });
  },
  revokePermissions: function (id, permissionIds, done) {
    mongoose.model('Role').findById(id, function (err, role) {
      console.log("final permissions:\n" + permissionIds);
      // 去除选择解除权限的权限ID
      role.permissions = _.remove(role.permissions, function (n) {
        var idx = permissionIds.some(function (p) {
          //字符串比较
          return p == n + "";
        });
        return !(permissionIds == n + "" || idx);
      });
      role.save(function (err, role) {
        done(err, role);
      });
    });
  },
  //检测是否已经被赋予角色
  can: function (action, subject, done) {
    mongoose.model('Role').findById(this._id, function (err, role) {
      if (err) return done(err);
      doCan.call(role, CAN_ALL, [[action, subject]], done);
    });
  },

  //检测是否已经被赋予全部角色
  canAll: function (actionsAndSubjects, done) {
    mongoose.model('Role').findById(this._id, function (err, role) {
      if (err) return done(err);
      doCan.call(role, CAN_ALL, actionsAndSubjects, done);
    });
  },

  //检测是否已经被赋予任何一个角色
  canAny: function (actionsAndSubjects, done) {
    mongoose.model('Role').findById(this._id, function (err, role) {
      if (err) return done(err);
      doCan.call(role, CAN_ANY, actionsAndSubjects, done);
    });
  }
};

module.exports = mongoose.model('Role', RoleSchema, 'roles');

