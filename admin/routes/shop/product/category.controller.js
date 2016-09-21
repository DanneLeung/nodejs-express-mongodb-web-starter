/**
 * 菜单管理
 */
var mongoose = require('mongoose');
var Category = mongoose.model('Category');
var Module = mongoose.model('Module');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('lodash');

/*
 * list
 */
exports.list = function (req, res) {
  Category.find({parentId: null,"channel": req.session.channelId}).exec(function (err, categorys) {
    res.render('shop/product/category/treeList', {
      categorys: categorys
    })
  })
};
exports.saveSort = function (req, res) {
  var ids = req.body.id;
  var sorts = req.body.sort;
  console.log("############# ids: " + ids);
  console.log("############# sorts: " + sorts);
  if (ids) {
    for (var i = 0; i < ids.length; i++) {
      Category.update({_id: ids[i]}, {$set: {sort: sorts[i]}}).exec();
    }
    req.flash('success', '保存排序成功!');
  } else {
    req.flash('error', '保存排序失败，没有数据!');

  }
  res.redirect('/shop/product/category/');
};
/**
 * 获取到菜单的子菜单
 * @param req
 * @param res
 */
exports.getChildren = function (req, res) {
  var parentId = req.params.parentId || req.query.parentId;
  console.log("------------------------------------------");
  console.log(parentId);
  Category.find({"parentId": parentId}).sort("sort").exec(function (err, categorys) {
    if (!err) {
      res.render('shop/product/category/children', {
        categorys: categorys
      })
    }
  });
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  Category.dataTable(req.query, {
    conditions: {
      "channel": req.session.channelId || req.session.channel._id
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
  Category.find({channel:req.session.channelId}).sort({lineage: 1, sort: 1}).exec().then(function (categorys) {
    res.render('shop/product/category/form', {
      viewType: "add",
      category: new Category({parentId: req.params.parentId || req.query.parentId}),
      categorys: categorys
    });
  });
};

/**
 * 修改菜单的信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.param("id");

  Category.findOne({'_id': id}).exec().then(function (category) {
      return Category.find({channel:req.session.channelId}).sort({lineage: 1, sort: 1}).exec().then(function (categorys) {
        var result = {};
        result.categorys = categorys;
        result.category = category;
        return result;
      });
    })
    .then(function (result) {
      res.render('shop/product/category/form', {
        viewType: "edit",
        categorys: result.categorys,
        category: result.category
      });
    }).then(undefined, function (err) {
    if (err) {
      console.log("**** error ... " + err);
      req.flash('error', err);
      res.redirect('/shop/product/category/');
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
  Category.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Category.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/product/category/');
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
  Category.findOne({'_id': id}, function (err, category) {
    if (!err) {
      if (category.topNav == true) {
        updata.topNav = false;
        msg = "已修改为不是新窗口打开"
      } else {
        updata.topNav = true;
        msg = "已修改为新窗口打开"
      }
      Category.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/product/category/');
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
  Category.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      Category.remove({'parentId': ids}, function (err, result) {
        if (err) {
          console.log(err);
        }
      })
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/product/category/');
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
    Category.count({name: newName, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkCode = function (req, res) {
  var code = req.query.code;
  var oldCode = req.query.oldCode;
  if (code === oldCode) {
    res.send('true');
  } else {
    Category.count({code: code, channel: req.session.channelId}, function (err, result) {
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
  if (!req.body.parentId) req.body.parentId = null;

  if (!id) {

    var category = new Category(req.body);
    category.leaf = true;
    category.channel = req.session.channelId;
    category.save(function (err, category) {
      console.log("********** Saved category：" + category);
      req.flash('success', '数据保存成功!');
      res.redirect('/shop/product/category/');
    });
  } else {
    // update
    Category.findOne({'_id': id}, function (err, category) {
      category.set(req.body);
      category.save(function (err, m) {
        if (err)
          console.error(err);
        req.flash('success', '数据修改成功!');
        res.redirect('/shop/product/category/');
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
exports.getCategorys = function (req, res) {
  Category.find({}, function (err, category) {
    res.send(category);
  });
};
