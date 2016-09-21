/**
 * 菜单管理
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var Menu = mongoose.model('Menu');
var Module = mongoose.model('Module');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('lodash');

/*
 * list
 */
exports.list = function (req, res) {
  Menu.find({}).exec(function (err, menus) {
    res.render('system/menu/menuTreeList', {
      menus: menus
    })
  })
};
exports.saveSort = function (req, res) {
  var ids = req.body.id;
  var sorts = req.body.sort;
  console.log("############# ids: " + ids);
  console.log("############# sorts: " + sorts);
  for (var i = 0; i < ids.length; i++) {
    Menu.update({ _id: ids[i] }, { $set: { sort: sorts[i] } }).exec();
  }
  req.flash('success', '保存排序成功!');
  res.redirect('/system/menu');
};
/**
 * 获取到菜单的子菜单
 * @param req
 * @param res
 */
exports.getChildren = function (req, res) {
  var parentId = req.params.parentId || req.query.parentId;
  Menu.findById(parentId).sort("sort").exec(function (err, menu) {
    if (!err) {
      res.render('system/menu/menuChildren', {
        menus: menu.children
      })
    }else{
      console.error(err);
    }
  });
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  Menu.dataTable(req.query, {
    conditions: {
      "channel": req.params.channelId || req.session.channel._id
    }
  }, function (err, data) {
    res.send(data);
  });
};
/**
 * 添加菜单的类别
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  //使用promise
  Module.find({ enabled: true }).exec().then(function (modules) {
    var result = {};
    // 返回promise
    return Menu.find().exec().then(function (menus) {
      result.modules = modules;
      result.menus = menus;
      return result;
    });
  })
    .then(function (result) {//上个promise返回的数据
      res.render('system/menu/menuForm', {
        viewType: "add",
        menus: result.menus,
        modules: result.modules,
        menu: new Menu({ parentId: req.params.parentId || req.query.parentId })
      });
    }).then(undefined, function (err) {
      if (err) {
        req.flash('error', err);
        res.redirect('/system/menu');
      }
    });

};

/**
 * 修改菜单的信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id || req.query.id;

  Menu.findOne({ '_id': id }).exec().then(function (menu) {
    var result = {};
    return Module.find({ enabled: true }).exec().then(function (modules) {
      result.menu = menu;
      result.modules = modules;
      return result;
    });
  }).then(function (result) {
    return Menu.find().sort({ lineage: 1, sort: 1 }).exec().then(function (menus) {
      result.menus = menus;
      return result;
    });
  }).then(function (result) {
    res.render('system/menu/menuForm', {
      viewType: "edit",
      menus: result.menus,
      modules: result.modules,
      menu: result.menu
    });
  }).then(undefined, function (err) {
    if (err) {
      console.log("**** error ... " + err);
      req.flash('error', err);
      res.redirect('/system/menu');
    }
  });
};
/**
 * 是否激活菜单
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.param("id");
  var updata = {};
  var options = {};
  var msg = "";
  Menu.findOne({ '_id': id }, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Menu.update({ '_id': id }, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/menu');
        }
      });
    }
  });
};
/**
 * 是否激活菜单
 * @param req
 * @param res
 */
exports.topNav = function (req, res) {
  var id = req.param("id");
  var updata = {};
  var options = {};
  var msg = "";
  Menu.findOne({ '_id': id }, function (err, menu) {
    if (!err) {
      if (menu.topNav == true) {
        updata.topNav = false;
        msg = "已修改为不是新窗口打开"
      } else {
        updata.topNav = true;
        msg = "已修改为新窗口打开"
      }
      Menu.update({ '_id': id }, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/menu');
        }
      });
    }
  });
};

/**
 * 删除菜单
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Menu.remove({ '_id': ids }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/menu');
    }
  });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.title;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Menu.count({ title: newName }, function (err, result) {
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
  var parentId = req.body.parentId;
  if (parentId == 'null') {
    req.body.parentId = null;
  }
  // handle checkbox unchecked.Å
  if (!req.body.enabled) req.body.enabled = false;
  if (!req.body.topNav) req.body.topNav = false;
  if (!req.body.module) req.body.module = null;
  if (!req.body.parentId) req.body.parentId = null;

  if (!id) {
    var menu = new Menu(req.body);
    menu.leaf = true;
    menu.save(function (err, menu) {
      console.log("********** Saved menu：" + menu);
      if (err) {
        req.flash('err', err);
      } else {
        req.flash('success', '数据保存成功!');
        res.redirect('/system/menu');
      }
    });
  } else {
    // update
    Menu.findOne({ '_id': id }, function (err, menu) {
      menu.set(req.body);
      menu.save(function (err, m) {
        if (err)
          console.error(err);
        req.flash('success', '数据修改成功!');
        res.redirect('/system/menu');
      });
    }).then(function (err) {
      if (err) {
        req.flash('error', err.message);
      }
    });
  }
};


/**
 * 获取菜单填充列表框
 * @param req
 * @param res
 */
exports.getMenus = function (req, res) {
  Menu.find({}, function (err, menu) {
    res.send(menu);
  });
};
