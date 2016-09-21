/**
 * Created by xingjie201 on 2016/3/18.
 */
'use strict';
var mongoose = require('mongoose');
var Comment = mongoose.model('ProductComment');
var Product = mongoose.model('Product');
var Member = mongoose.model('Member');
var Order = mongoose.model('Order');
var _ = require('lodash');

var moment = require('moment');
var async = require('async');

var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');


exports.list = function (req, res) {
  res.render('shop/product/comment/list');
};

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  var product = req.params.product || req.body.product
  var order = req.params.order || req.body.order
  var member = req.params.member || req.body.member
  var query = {};
  if (product) {
    query.product = product;
  }
  if (order) {
    query.order = order;
  }
  if (member) {
    query.member = member;
  }

  Comment.dataTable(req.query, {conditions: {}}, function (err, data) {
    res.send(data);
  });
};


exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Comment.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
    }
    res.redirect('/shop/product/comment/list');
  });
};

exports.edit = function (req, res) {
  var id = req.params.id || req.body.id;
  Comment.findOne({'_id': id}).populate([
    {"path": "product", "select": "name"},
    {"path": "Member", "select": "username"},
    {"path": "order", "select": "no"}]).exec(function (err, comment) {
    if (!err) {
      res.render('shop/product/comment/form', {comment: comment});
    } else {
      req.flash('error', "没有找到该数据信息");
      res.redirect('/shop/product/comment/list');
    }
  });
};

/**
 * 是否显示该评价
 * @param req
 * @param res
 */
exports.display = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var msg = "";
  Comment.findOne({'_id': id}, function (err, comment) {
    if (!err) {
      if (comment.display == true) {
        updata.display = false;
        msg = "已设置为隐藏"
      } else {
        updata.display = true;
        msg = "已设置为显示"
      }
      Comment.update({'_id': id}, updata, {}, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/product/comment/list');
        }
      });
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
  Comment.findByIdAndUpdate(id, req.body, function (err, result) {
    handle(req, res, err, req.body);
  });
};

function setValues(req, files) {
  var names = req.body.names;
  var sorts = req.body.sorts;
  req.body.values = [];
  if (names && names instanceof Array) {
    //数组形式的合并
    //合并成对象
    for (var i = 0; i < names.length; i++) {
      var a = {};
      a.name = names[i];// award id.
      a.sort = sorts[i] ? sorts[i] : 0;
      a.image = files[i] ? files[i].thumb : '';
      req.body.values.push(a)
    }
  } else if (names) { //只有一个奖项的时候
    var a = {};
    a.name = names;// award id.
    a.sort = sorts ? sorts : 0;
    a.image = files[0] ? files[0].thumb : '';
    req.body.values.push(a)
  }

  if (req.body.values && req.body.values.length) {
    req.body.values = _.sortBy(req.body.values, ['sort']);
  }
}

//handle error
function handle(req, res, err, comment) {
  if (err) {
    req.flash('error', '保存失败!');
  } else {
    req.flash('success', '保存成功!');
  }
  res.redirect('/shop/product/comment/list');
}

/*get_product_select*/
exports.get_product_select = function (req, res) {
  var q = req.body.q || req.param("q");

  var query = {};
  if (q) {
    query.$or = [{name: {$regex: q}}, {no: {$regex: q}}]
  }
  query.enabled = true;
  Product.find(query, function (err, products) {
    var datas = [];
    if (products) {
      products.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.no + "-" + e.name;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};
/*get_order_select*/
exports.get_order_select = function (req, res) {
  var q = req.body.q || req.param("q");

  var query = {};
  if (q) {
    query.no = {$regex: q}
  }
  query.enabled = true;
  query.status = '05';
  Order.find(query, function (err, orders) {
    var datas = [];
    if (orders) {
      orders.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.no;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};
/*get_memder_select*/
exports.get_member_select = function (req, res) {
  var q = req.body.q || req.param("q");

  var query = {};
  if (q) {
    query.username = {$regex: q}
  }
  query.enabled = true;
  query.status = '05';
  Member.find(query, function (err, members) {
    var datas = [];
    if (members) {
      members.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.username;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};
