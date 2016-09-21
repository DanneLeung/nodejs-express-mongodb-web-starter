/**
 * Created by xingjie201 on 2016/3/18.
 */
'use strict';
var mongoose = require('mongoose');
var Product = mongoose.model('Product');
var ProductSku = mongoose.model('ProductSku');
var Option = mongoose.model('ProductOption');
var OptionValue = mongoose.model('ProductOptionValue');
var AttrGroup = mongoose.model('ProductAttributeGroup');
var ProductAttr = mongoose.model('ProductAttribute');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');
var async = require('async');
var utility = require('utility');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');


exports.index = function (req, res) {
  res.render('shop/product/index');
};
exports.form = function (req, res) {
  var id = req.params.id || req.query.id;
  res.render('shop/product/form');
};


exports.add = function (req, res) {
  Option.find({channel: req.session.channelId}, function (err, options) {
    res.render('shop/product/form', {product: new Product(), options: options});
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Product.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/product/index');
    }
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  async.waterfall([function (callback) {  //获取产品数据
    var result = {};
    Product.findById(id).exec(function (err, product) {
      result.product = product;
      callback(err, result);
    });
  }, function (result, callback1) {//获取选项数据
    Option.find({channel: req.session.channelId}, function (err, options) {
      result.options = options;
      callback1(err, result);
    });
  }, function (result, callback2) {//获取产品中包含选项的所有values值的集合
    var options = result.product.options;
    if (options && options.length > 0) {
      async.map(options, function (id, callback) {
        OptionValue.find({option: id}).populate("option").exec(function (err, values) {
          callback(err, values);
        });
      }, function (err, values) {
        var titles = [];
        var valuejs = [];//用于js中添加SKU的时候使用
        for (var i in values) {
          titles.push(values[i][0].option.name);
          var value = [];
          for (var j in values[i]) {//每个属性的所有值
            var obj = {};
            obj._id = values[i][j]._id;
            obj.name = values[i][j].name;
            value.push(obj);
          }
          var arr = {};
          arr.value = value;
          valuejs.push(arr);
        }
        console.log("values==================", valuejs);
        var num = 12 / values.length
        result.num = num; //title 中的标题数量
        result.titles = titles; //标题
        result.values = values; //values值页面中使用的集合
        result.valuejs = JSON.stringify(valuejs); //values值js中使用的集合
        callback2(err, result);
      });
    }
  }, function (result, callback3) { //获取产品SKU的所有数据
    ProductSku.find({product: id}, function (err, skus) {
      result.skus = skus;
      callback3(err, result);
    });
  }, function (result, callback4) { //获取产品SKU的所有数据
    AttrGroup.find({channel: req.session.channelId}, function (err, groups) {
      result.groups = groups;
      result.groupJs = JSON.stringify(groups);
      callback4(err, result);
    });
  }], function (err, result) {
    if (err) {
      req.flash('error', '产品可能被删除!');
      res.redirect('/shop/product/index');
    } else {
      res.render('shop/product/form', result);
    }
  });

};

/**
 * 保存数据
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.channel = req.session.channelId;

  //新增或者更新
  var saveOrUpdate = function (id, req, callback) {
    async.waterfall([function (callback1) {
      handle(req, function (err, result) {
        callback1(err, result);
      })
    }, function (result, callback2) {
      Product.findByIdAndUpdate(id, req.body, {new: true, upsert: true}, function (err, p) {
        callback2(err, p);
      });
    }], function (err, result) {
      callback(err, result)
    });

  };
  var handleResult = function (err, p) {
    if (err) {
      req.flash('error', '保存数据时发生异常.');
      return res.redirect('/shop/product/index');
    } else {
      console.log("*********** 外链商品保存成功，", p);
      req.flash('success', '数据保存成功!');
      res.redirect('/shop/product/index');
    }
  };
  saveSku(id, req, function (err, sku) {
    if (err) {
      req.flash('error', err);
      res.redirect('/shop/product/index');
    }
  })

  //saveOrUpdate(id, req, handleResult);

  //如果没有上传文件，则直接保存

   if (!req.files || req.files.length <= 0) {
    console.log("#############################################");
    saveOrUpdate(id, req, handleResult);
  } else {
     req.body.images = [];
    // 先存储文件
    console.log("********************************************");
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'linkproduct', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.normalize(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
              var fieldname = files[i].fieldname;
              if(fieldname == "thumbImage"){
                req.body["thumbImage"] = files[i].thumb;
              }else if(fieldname == "images"){
                req.body.images.push(files[i].thumb);
              }
              console.log("********** setting  body %s - %s : ", fieldname, files[i].path);
            }
          }
          if (!req.body.thumbImage) {
            delete req.body.thumbImage
          }
          saveOrUpdate(id, req, handleResult);
        });
      });
    });
  }

};
/**
 * 处理产品数据
 * @param req
 */
function handle(req, callback) {
  var size = {};
  var weight = {};
  size.lengthClass = req.body.lengthClass;
  size.length = req.body.length;
  size.width = req.body.width;
  size.height = req.body.height;
  weight.weightClass = req.body.weightClass;
  weight.weight = req.body.weight;
  if (!req.body.substract) {
    req.body.substract = false;
  }
  if (!req.body.shipping) {
    req.body.shipping = false;
  }
  if (!req.body.enabled) {
    req.body.enabled = false;
  }
  req.body.size = size;
  req.body.weight = weight;
  req.body.attributes = [];
  var groupIds = req.body.group;//处理属性的数据
  if (groupIds && groupIds instanceof Array) {
    async.map(groupIds, function (groupId, dome) {//使用map将分组循环出来
      var attr = {};
      attr.group = groupId;
      attr.attrs = [];
      console.log("groupId==================", groupId);
      ProductAttr.find({group: groupId}, function (err, attrs) { //根据分组Id获取所有的属性
        if (attrs) {
          for (var i in attrs) { //循环每个属性
            var a = {};
            a.attr = attrs[i]._id;
            a.value = req.body[attrs[i]._id];//获取页面数据
            attr.attrs.push(a);
          }
        }
        dome(null, attr);
      });
    }, function (err, result) {
      if (result) {
        for (var i in result) { //处理属性的结果数据
          req.body.attributes.push(result[i]);
        }
        return callback(null, result);
      }
    });
  } else {
    var attr = {};
    attr.group = groupIds;
    attr.attrs = [];
    ProductAttr.find({group: groupIds}, function (err, attrs) { //根据分组Id获取所有的属性
      if (attrs) {
        for (var i in attrs) { //循环每个属性
          var a = {};
          a.attr = attrs[i]._id;
          a.value = req.body[attrs[i]._id];//获取页面数据
          attr.attrs.push(a);
        }
      }
      req.body.attributes.push(attr);
      return callback(null, attr);
    });
  }
}

/**
 * 保存SKU的数据
 * @param id
 * @param req
 * @param callback
 */
function saveSku(id, req, callback) {
  var quantity = req.body.skuQuantity;
  var price = req.body.skuPrices;
  var points = req.body.skuPoints;
  var weight = req.body.skuWeight;
  if (id) {
    Product.findById(id, function (err, product) {
      if (product) {
        var len = product.options.length;
        async.waterfall([function (callback) {
          ProductSku.remove({}, function (err, sku) {
            console.log("SKU已删除");
            callback(err, sku);
          });
        }, function (sku, callback1) {
          if (quantity && quantity instanceof Array) {
            console.log("saveSku===========================6", "多个数据的时候");
            for (var i = 0; i < quantity.length; i++) {
              var sku = new ProductSku();
              sku.quantity = quantity[i];// 数量
              sku.price = price[i];// 价格的加减
              sku.points = points[i];// 积分的加减
              sku.weight = weight[i];// 重量的加减
              sku.product = id;// 关联产品
              sku.channel = req.session.channelId;// 渠道
              for (var j = 0; j < len; j++) {
                var value = req.body["value" + j];
                console.log("value=================", value);
                sku.options.push(value[i]);
              }
              sku.save(function (err, sku) {
              });
            }
          } else {
            console.log("saveSku===========================6", "一个数据的时候");
            var sku = new ProductSku();
            sku.quantity = quantity;// 数量
            sku.price = price;// 价格的加减
            sku.points = points;// 积分的加减
            sku.weight = weight;// 重量的加减
            sku.product = id;// 关联产品
            sku.channel = req.session.channelId;// 渠道
            for (var j = 0; j < len; j++) {
              var value = req.body["value" + j];
              sku.options.push(value);
            }
            sku.save(function (err, sku) {
              console.log("saveSku==========================6", sku);
            });
          }
          callback1(null, true);
        }], function (err, result) {
          return callback(err, result);
        });
      } else {
        return callback("产品没找到", null);
      }
    });
  } else {
    return callback("产品没找到", null);
  }
}

/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  var category = req.query.category;//商品分类
  var startDate = req.query.startDate;//活动开始
  var endDate = req.query.endDate;//活动结束
  var name = req.query.name;//产品名称
  //排序筛选条件
  var querys = {};
  if (category != "" && category != undefined) {
    querys.category = {$regex: category};
  }
  if (endDate != "" && endDate != undefined) {
    var end = new Date(moment(endDate).format("YYYY/MM/DD 00:00:00"));
    querys.endDate = {$lt: end};
  }
  Product.dataTable(req.query, {conditions: querys}, function (err, data) {
    res.send(data);
  });
};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkNo = function (req, res) {
  var no = req.query.no;
  var oldNo = req.query.oldNo;
  if (no === oldNo) {
    res.send('true');
  } else {
    Product.count({'no': no, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 上传图片
 */
exports.upload = function (req, res) {
  fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'link', false, function (fs) {
    // 生成缩略图
    console.log("********** files uploaded: " + JSON.stringify(fs));
    imgUtil.thumbnail(fs, 200, function (ffs) {
      console.log("********** files thumbnailed: " + JSON.stringify(ffs));
      fileUtl.normalize(ffs, function (err, files) {
        if (!err && files && files.length > 0) {
          return res.json({success: true, src: req.session.staticRoot + files[0].path});
        } else {
          return res.json({success: false, error: err || '上传失败！'});
        }
      })
    });
  });
};
/**
 * 是否激活菜单
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id || req.query.id;
  var updata = {};
  var msg = "";
  Product.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Product.update({'_id': id}, updata, {}, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/product/index');
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
exports.down = function (req, res) {
  var id = req.params.id || req.query.id;
  var updata = {};
  updata.avaliable = false;
  Product.update({'_id': id}, updata, {}, function (err, info) {
    if (!err) {
      req.flash('success', "已下架");
      res.redirect('/shop/product/index');
    }
  });
};
/**
 * 是否激活菜单
 * @param req
 * @param res
 */
exports.up = function (req, res) {
  var id = req.body.id || req.query.id;
  var time = req.body.time || req.query.time;
  var updata = {};
  updata.avaliable = true;
  updata.date_avaliable = new Date(time);
  Product.update({'_id': id}, updata, {}, function (err, info) {
    if (!err) {
      req.flash('success', "已上架");
      res.redirect('/shop/product/index');
    }
  });
};
