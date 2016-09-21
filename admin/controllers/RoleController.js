/**
 * Created by danne on 2015/10/29.
 */
"use strict";

var mongoose = require('mongoose');
var Role = mongoose.model('Role');
var Permission = mongoose.model('Permission');
var async = require('async');
var config = require('../../config/config');

/*
 * list
 */
exports.list = function (req, res) {
  Role.find({}, function (err, users) {
    res.render('system/role/roleList', {
      users: users
    })
  })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  Role.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};
/*permission list table json datasource*/
exports.datatablePermission = function (req, res) {
  var roleId = req.params.roleId;
  getPermissionIds(roleId,function(ids){
    console.log("===========ids==============================================");
    console.log(ids);
    if(ids!=null){
      Permission.dataTable(req.query,{conditions: {"_id": {$nin: ids}}}, function (err, data) {
        res.send(data);
      });
    }else{
      Permission.dataTable(req.query, function (err, data) {
        res.send(data);
      });
    }

  });

};
/**
 * 根据角色获取该角色的所有权限的ID
 * @param roleId
 */
function getPermissionIds(roleId,callback){
  if (!roleId) {
    callback(null);
  } else {
    Role.permissions(roleId, function (permissions) {
      var ids=[];
      for(var v=0; v<permissions.length;v++){
        var id=permissions[v]._id;
        ids.push(id);
      }
      if(ids.length>0){
        callback(ids);
      }else{
        callback(null);
      }
    });
  }
}
exports.add = function (req, res) {
  res.render('system/role/roleForm', {
    viewType: "add",
    role: new Role()
  })
};

exports.edit = function (req, res) {
  var id = req.param("id");
  Role.findOne({'_id': id}, function (err, role) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/system/role');
    } else {
      res.render('system/role/roleForm', {
        viewType: "edit",
        role: role
      })
    }
  });
};


exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Role.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/role');
    }
  });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Role.count({name: newName}, function (err, result) {
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
  if (!id) {
    var role = new Role(req.body);
    role.save(function (err, result) {
      handleSaved(req, res, err, role, 'add');
    });
  } else {
    // update
    Role.update({'_id': id}, req.body, function (err, result) {
      handleSaved(req, res, err, req.body, 'edit');
    });
  }
};

// handle object saved
function handleSaved(req, res, err, result, type) {
  if (err) {
    console.log(err);
    req.flash('error', '角色保存失败!');
    res.render('system/role/roleForm', {
      viewType: type,
      role: result
    });
  } else {
    req.flash('success', '角色保存成功!');
    res.redirect('/system/role');
  }
}

/**
 * 查找指定角色的权限
 * @param req
 * @param res
 */
exports.permissions = function (req, res) {
  var roleId = req.params.roleId;
  console.log("RoleID: " + roleId);
  if (!roleId) {
    res.send({});
  } else {
    Role.permissions(roleId, function (permissions) {
      res.send(permissions);
    });
  }

};

/**
 * 角色授予权限
 * @param req
 * @param res
 */
exports.addPermissions = function (req, res) {
  var roleId = req.params.roleId;
  var permissionIds = req.body.permissionIds || req.params.permissionIds;
  console.log("RoleID: " + roleId + ", PermissionIds: " + permissionIds);
  if (!roleId) {
    res.send({});
  } else {
    Role.addPermissions(roleId, permissionIds, function (err, role) {
      if (err) {
        res.send({code: 1, msg: '角色授予权限失败，请联系管理员!'});
      } else {
        res.send({code: 0, msg: ''});
      }
    });
  }
};
/**
 * 角色授予权限
 * @param req
 * @param res
 */
exports.revokePermissions = function (req, res) {
  var roleId = req.params.roleId;
  var permissionIds = req.body.permissionIds || req.params.permissionIds;
  console.log("Revoke permissions with RoleID: " + roleId + ", PermissionIds: " + permissionIds);
  if (!roleId) {
    res.send({});
  } else {
    Role.revokePermissions(roleId, permissionIds, function (err, role) {
      if (err) {
        res.send({code: 1, msg: '角色授予权限失败，请联系管理员!'});
      } else {
        res.send({code: 0, msg: ''});
      }
    });
  }
};