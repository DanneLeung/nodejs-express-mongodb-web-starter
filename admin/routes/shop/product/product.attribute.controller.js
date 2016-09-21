/**
 * Created by xingjie201 on 2016/3/18.
 */
'use strict';
var mongoose = require('mongoose');
//var Page = mongoose.model('Page');
var Attribute = mongoose.model('ProductAttribute');
var Store = mongoose.model('Store');
var AttributeGroup = mongoose.model('ProductAttributeGroup');
var _ = require('lodash');
var moment = require('moment');
var async = require('async');


exports.groupList = function (req, res) {
  res.render('shop/product/attribute/groupList');
};

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable_group = function (req, res) {

  AttributeGroup.dataTable(req.query, {conditions: {channel: req.session.channelId}}, function (err, data) {
    res.send(data);
  });
};

exports.add_group = function (req, res) {
  res.render('shop/product/attribute/groupForm', {group: new AttributeGroup()});
};

exports.del_group = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  AttributeGroup.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
    }
    res.redirect('/shop/product/attribute/groupList');
  });
};

exports.edit_group = function (req, res) {
  var id = req.params.id || req.body.id;
  AttributeGroup.findOne({'_id': id}).populate("store").exec(function (err, group) {
    if (group) {
      res.render('shop/product/attribute/groupForm', {group: group});
    } else {
      req.flash('error', "没有找到该数据信息");
      res.redirect('/shop/product/attribute/groupList');
    }
  });
};


exports.getStore = function (req, res) {
  var q = req.body.q || req.param("q");
  Store.find({name: {$regex: q}}, function (err, group) {
    var datas = [];
    if (group) {
      group.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.name;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};


/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save_group = function (req, res) {
  var id = req.body.id;
  //处理发布的商品
  if (!id) {
    var group = new AttributeGroup(req.body);
    group.channel = req.session.channelId;
    group.save(function (err, result) {
      handle_group(req, res, err, result);
    });
  } else {
    // update
    AttributeGroup.findByIdAndUpdate(id, req.body, function (err, result) {
      handle_group(req, res, err, req.body);
    });
  }
};

//handle error
function handle_group(req, res, err, group) {
  if (err) {
    req.flash('error', '保存失败!');
    res.render('shop/product/attribute/groupForm', {
      group: group == null ? new AttributeGroup() : group
    });
  } else {
    req.flash('success', '保存成功!');
    res.redirect('/shop/product/attribute/groupList');
  }
}


/**
 * 检查名称是否已经存在^
 */
exports.checkName_group = function (req, res) {
  var name = req.query.name;
  var oldName = req.query.oldName;
  if (name === oldName) {
    res.send('true');
  } else {
    AttributeGroup.count({'name': name, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.saveSort_group = function (req, res) {
  var ids = req.body.id;
  var sorts = req.body.sort;
  console.log("############# ids: " + ids);
  console.log("############# sorts: " + sorts);
  if (ids) {
    for (var i = 0; i < ids.length; i++) {
      AttributeGroup.update({_id: ids[i]}, {$set: {sort: sorts[i]}}).exec();
    }
    req.flash('success', '保存排序成功!');
  } else {
    req.flash('error', '保存排序失败，没有数据!');

  }
  res.redirect('/shop/product/attribute/groupList');
};

exports.list = function (req, res) {
  res.render('shop/product/attribute/list', {groupId: req.params.groupId});
};

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {

  Attribute.dataTable(req.query, {
    conditions: {
      channel: req.session.channelId,
      group: req.params.groupId
    }
  }, function (err, data) {
    res.send(data);
  });
};

exports.add = function (req, res) {
  res.render('shop/product/attribute/form', {attr: new Attribute(), groupId: req.params.groupId});
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Attribute.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
    }
    res.redirect('/shop/product/attribute/list/' + req.params.groupId);
  });
};

exports.edit = function (req, res) {
  var id = req.params.id || req.body.id;
  var groupId = req.params.groupId || req.body.groupId;
  Attribute.findOne({'_id': id}, function (err, attr) {
    if (!err) {
      res.render('shop/product/attribute/form', {attr: attr, groupId: groupId});
    } else {
      req.flash('error', "没有找到该数据信息");
      res.redirect('/shop/product/attribute/list/' + groupId);
    }
  });
};


/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  //处理发布的商品
  if (!id) {
    var group = new Attribute(req.body);
    group.channel = req.session.channelId;
    group.save(function (err, result) {
      handle(req, res, err, result);
    });
  } else {
    // update
    Attribute.findByIdAndUpdate(id, req.body, function (err, result) {
      handle(req, res, err, req.body);
    });
  }
};

//handle error
function handle(req, res, err, attr) {
  if (err) {
    req.flash('error', '保存失败!');
    res.render('shop/product/attribute/form', {
      attr: attr == null ? new Attribute() : attr,
      groupId: attr == null ? '' : attr.group,
    });
  } else {
    req.flash('success', '保存成功!');
    res.redirect('/shop/product/attribute/list/' + req.params.groupId);
  }
}


/**
 * 检查名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var name = req.query.name;
  var oldName = req.query.oldName;
  if (name === oldName) {
    res.send('true');
  } else {
    Attribute.count({'name': name, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.saveSort = function (req, res) {
  var ids = req.body.id;
  var sorts = req.body.sort;
  if (ids) {
    for (var i = 0; i < ids.length; i++) {
      Attribute.update({_id: ids[i]}, {$set: {sort: sorts[i]}}).exec();
    }
    req.flash('success', '保存排序成功!');
  } else {
    req.flash('error', '保存排序失败，没有数据!');

  }
  res.redirect('/shop/product/attribute/list/' + req.params.groupId);
};

/**
 * 根据属性分组获取属性
 * @param req
 * @param res
 */
exports.getAttributes = function (req, res) {
  var groupId = req.body.groupId || req.query.groupId;
  Attribute.find({group:groupId}, function(err,attrs){
    res.send(attrs);
  });

};
