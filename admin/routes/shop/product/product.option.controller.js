/**
 * Created by xingjie201 on 2016/3/18.
 */
'use strict';
var mongoose = require('mongoose');
//var Page = mongoose.model('Page');
var Store = mongoose.model('Store');
var Option = mongoose.model('ProductOption');
var OptionValue = mongoose.model('ProductOptionValue');
var _ = require('lodash');

var moment = require('moment');
var async = require('async');

var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');


exports.list = function (req, res) {
  res.render('shop/product/option/list');
};

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {

  Option.dataTable(req.query, {conditions: {channel: req.session.channelId}}, function (err, data) {
    res.send(data);
  });
};

exports.add = function (req, res) {
  Option.getType(function (err, types) {
    res.render('shop/product/option/form', {option: new Option(), types: types, values: []});
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Option.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
    }
    res.redirect('/shop/product/option/list');
  });
};

exports.edit = function (req, res) {
  var id = req.params.id || req.body.id;
  async.waterfall([function (callback) {
    Option.getType(function (err, types) {
      callback(err, types);
    });
  }, function (types, dome) {
    Option.findOne({'_id': id}, function (err, option) {
      var result = {};
      if (option) {
        result.option = option;
        result.types = types;
        dome(null, result);
      } else {
        dome('没有找到修改的数据', result);
      }
    });
  }, function (result, domes) {
    OptionValue.find({option: id}, function (err, values) {
      result.values = values;
      domes(err, result);
    });
  },], function (err, result) {
    if (!err) {
      res.render('shop/product/option/form', result);
    } else {
      req.flash('error', "没有找到该数据信息");
      res.redirect('/shop/product/option/list');
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
    var option = new Option(req.body);
    option.channel = req.session.channelId;
    option.save(function (err, result) {
      if (result) {
        setValues(req, result._id, function (err, values) {
          handle(req, res, err, result);
        });
      }
    });
  } else {
    // update
    Option.findByIdAndUpdate(id, req.body, function (err, result) {
      if (result) {
        setValues(req, result._id, function (err, result) {
          handle(req, res, err, req.body);
        });
      }
    });
  }
};

function setValues(req, id, callback) {
  var names = req.body.names;
  var sorts = req.body.sorts;
  var result = [];
  if (names && names instanceof Array) {
    //数组形式的合并
    //合并成对象
    for (var i = 0; i < names.length; i++) {
      var a = {};
      a.name = names[i];// award id.
      a.sort = sorts[i] ? sorts[i] : 0;
      a.option = id;
      result.push(a)
    }
  } else if (names) { //只有一个奖项的时候
    var a = {};
    a.name = names;// award id.
    a.sort = sorts ? sorts : 0;
    a.option = id;
    result.push(a)
  }

  if (result && result) {
    result = _.sortBy(result, ['sort']);
  }
  if (result && result.length > 0) {
    OptionValue.remove({option:id},function(err,values){
      mongoose.connection.collections['productoptionvalues'].insertMany(result, {ordered: false}, function (err, result) {
        callback(err, result);
      })
    });
  }
}

//handle error
function handle(req, res, err, option) {
  if (err) {
    req.flash('error', '保存失败!');
    res.render('shop/product/option/form', {
      option: option == null ? new Option() : option
    });
  } else {
    req.flash('success', '保存成功!');
    res.redirect('/shop/product/option/list');
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
    Option.count({'name': name, channel: req.session.channelId}, function (err, result) {
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
  console.log("############# ids: " + ids);
  console.log("############# sorts: " + sorts);
  if (ids) {
    for (var i = 0; i < ids.length; i++) {
      Option.update({_id: ids[i]}, {$set: {sort: sorts[i]}}).exec();
    }
    req.flash('success', '保存排序成功!');
  } else {
    req.flash('error', '保存排序失败，没有数据!');

  }
  res.redirect('/shop/product/option/list');
};
