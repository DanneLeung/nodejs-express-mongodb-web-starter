/**
 * Created by danne on 2016-04-28.
 */
/**
 * 商城管理
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');

var SupplierContact = require('./supplier.contact.model');
var Supplier = require('./supplier.model');
var SupplierType = require('./supplier.type.model');
//
/**
 * 渠道中供应商的类型list
 * @param req
 * @param res
 */
exports.typeList = function (req, res) {
  res.render('shop/supplier/typeList');
};


/*SupplierType list table json datasource*/
exports.type_table = function (req, res) {
  SupplierType.dataTable(req.query, {
    conditions: {
      "channel": req.session.channelId || req.session.channel._id
    }
  }, function (err, data) {
    res.send(data);
  });
};//
/**
 * 渠道中供应商list
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  res.render('shop/supplier/list');
};


/*Supplier list table json datasource*/
exports.dataTable = function (req, res) {
  Supplier.dataTable(req.query, {
    conditions: {
      "channel": req.session.channelId || req.session.channel._id
    }
  }, function (err, data) {
    res.send(data);
  });
};
/**
 * 渠道中供应商联系人list
 * @param req
 * @param res
 */
exports.contactList = function (req, res) {
  res.render('shop/supplier/contactList', {supplier: req.params.id});
};


/*Supplier list table json datasource*/
exports.contact_table = function (req, res) {

  SupplierContact.dataTable(req.query, {
    conditions: {
      "supplier": req.params.supplier || req.query.supplier
    }
  }, function (err, data) {
    res.send(data);
  });
};

/**
 * 添加供应商的类别
 * @param req
 * @param res
 */
exports.type_add = function (req, res) {
  res.render('shop/supplier/typeForm', {
    viewType: "add",
    s_type: new SupplierType()
  });
};

/**
 * 添加供应商
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  SupplierType.find({'channel': req.session.channelId}, function (err, types) {
    res.render('shop/supplier/form', {
      viewType: "add",
      supplier: new Supplier(),
      types: types
    });
  });
};

/**
 * 添加供应商联系人
 * @param req
 * @param res
 */
exports.contact_add = function (req, res) {
  res.render('shop/supplier/contactForm', {
    viewType: "add",
    s_contact: new SupplierContact({
      supplier:req.params.supplier
    }),
  });
};

/**
 * 修改供应商类型
 * @param req
 * @param res
 */
exports.type_edit = function (req, res) {
  var id = req.params.id;

  SupplierType.findOne({'_id': id}, function (err, type) {
    if (err) {
      console.log("**** error ... " + err);
      req.flash('error', err);
      res.redirect('/shop/supplier/typeList');
    } else {
      res.render('shop/supplier/typeForm', {
        viewType: "edit",
        s_type: type
      });
    }
  });
};

/**
 * 修改供应商
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  async.waterfall([function (callback) {   //获取供应商类型的列表
    SupplierType.find({'channel': req.session.channelId}, function (err, types) {
      callback(err, types);
    });
  }, function (types, dome) {  //单独获取要修改的供应商信息
    Supplier.findOne({'_id': id}, function (err, supplier) {
      var result = {};
      result.types = types;
      result.supplier = supplier;
      dome(err, result);
    });
  }], function (err, result) { //处理结果
    if (err) {
      console.log("**** error ... " + err);
      req.flash('error', err);
      res.redirect('/shop/supplier/list');
    } else {
      res.render('shop/supplier/form', {
        viewType: "edit",
        supplier: result.supplier,
        types: result.types
      });
    }
  });

};

/**
 * 修改供应商的联系人
 * @param req
 * @param res
 */
exports.contact_edit = function (req, res) {
  var id = req.params.id;
  var supplier = req.params.supplier;

  SupplierContact.findOne({'_id': id}, function (err, contact) {
    if (err) {
      console.log("**** error ... " + err);
      req.flash('error', err);
      res.redirect('/shop/supplier/contactList/'+supplier);
    } else {
      res.render('shop/supplier/contactForm', {
        viewType: "edit",
        s_contact: contact
      });
    }
  });
};

/**
 * 是否激活品牌
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.param("id");
  var updata = {};
  var options = {};
  var msg = "";
  Brand.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Brand.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/supplier/');
        }
      });
    }
  });
};

/**
 * 删除品牌
 * @param req
 * @param res
 */
exports.type_del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  SupplierType.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/supplier/typeList');
    }
  });

};

/**
 * 删除品牌
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Supplier.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/supplier/list');
    }
  });

};

/**
 * 删除品牌
 * @param req
 * @param res
 */
exports.contact_del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  var supplier = req.body.supplier || req.params.supplier;
  SupplierContact.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/supplier/contactList/'+supplier);
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
    Supplier.count({name: newName, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 激活
 */
/**
 * 是否激活菜单
 * @param req
 * @param res
 */
exports.isEnable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var msg = "";
  Supplier.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Supplier.update({'_id': id}, updata, {}, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/supplier/list');
        }
      });
    }
  });
};

/**
 * 检查角色名称是否已经存在^
 */
exports.type_check_name = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    SupplierType.count({name: newName, channel: req.session.channelId}, function (err, result) {
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
exports.type_save = function (req, res) {
  var id = req.body.id;
  if (!id) {
    req.body.channel = req.session.channelId;
    var type = new SupplierType(req.body);
    type.save(function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/shop/supplier/typeList');
    });
  } else {
    // update
    SupplierType.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/shop/supplier/typeList');
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
  var op = req.body.time;
  if (op) {
    var split = op.split(" - ");
    req.body.begin = new Date(split[0]);
    req.body.end = new Date(split[1]);
  }
  if (!id) {
    req.body.channel = req.session.channelId;
    var supplier = new Supplier(req.body);
    supplier.save(function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/shop/supplier/list');
    });
  } else {
    // update
    Supplier.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/shop/supplier/list');
    });
  }
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.contact_save = function (req, res) {
  var id = req.body.id;
  var supplier = req.body.supplier;

  if (!id) {
    var contact = new SupplierContact(req.body);
    contact.save(function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/shop/supplier/contactList/'+supplier);
    });
  } else {
    // update
    SupplierContact.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/shop/supplier/contactList/'+supplier);
    });
  }
};
