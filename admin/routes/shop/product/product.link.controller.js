/**
 * Created by xingjie201 on 2016/3/18.
 */
'use strict';
var mongoose = require('mongoose');
var LinkProduct = mongoose.model('LinkProduct');
var LinkProductRelease = mongoose.model('LinkProductRelease');
var LinkProductSite = mongoose.model('LinkProductSite');
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
  res.render('shop/product/link/form', {product: new LinkProduct()});
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  LinkProduct.remove({
    '_id': ids
  }, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/product/link/list');
    }
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  LinkProduct.findById(id).exec(function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', '外链商品不存在，可能已被删除!');
      res.redirect('/shop/product/link/list');
    } else {
      res.render('shop/product/link/form', {product: result});
    }
  });
};

/**
 * 保存数据
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.channel = req.session.channelId;

  var startDate = req.body.startDate;
  if (startDate && startDate.indexOf(' - ')) {
    var dates = startDate.split(' - ');
    if (dates && dates.length == 2) {
      req.body.startDate = dates[0];
      req.body.endDate = dates[1];
    }
  }

  //新增或者更新
  var saveOrUpdate = function (id, req, callback) {
    LinkProduct.findByIdAndUpdate(id, req.body, {new: true, upsert: true}, function (err, p) {
      callback(err, p);
    });
  };
  var handleResult = function (err, p) {
    if (err) {
      req.flash('error', '保存数据时发生异常.');
      return res.render('shop/product/link/form', {product: req.body});
    }
    console.log("*********** 外链商品保存成功，", p);
    req.flash('success', '数据保存成功!');
    res.redirect('/shop/product/link/list');
  };

  //如果没有上传文件，则直接保存
  if (!req.files || req.files.length <= 0) {
    console.log("#############################################");
    saveOrUpdate(id, req, handleResult);
  } else {
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
              console.log("********** setting  body %s - %s : ", fieldname, files[i].path);
              req.body[fieldname] = files[i].thumb;
            }
          }
          if (!req.body.thumbImg) {
            delete req.body.thumbImg
          }
          saveOrUpdate(id, req, handleResult);
        });
      });
    });
  }
};
/**
 *  产品列表页跳转
 * @param req
 * @param res
 */
exports.linkList = function (req, res) {
  res.render('shop/product/link/linkList');
};

/**
 *  产品结果集列表跳转
 * @param req
 * @param res
 */
exports.releaseList = function (req, res) {
  res.render('shop/product/link/releaseList', {});
};
/**
 *  产品结果集列表跳转
 * @param req
 * @param res
 */
exports.findProduct = function (req, res) {
  var id = req.params.id || req.query.id;
  res.render('shop/product/link/releaseProductList', {id: id});
};
/**
 *  产品结果集列表跳转
 * @param req
 * @param res
 */
exports.cancelRelease = function (req, res) {
  var id = req.params.id || req.query.id;
  LinkProductRelease.findOne({"_id": id}, function (err, rp) {
    if (!err) {
      var updata = {};
      updata.published = false;
      LinkProductRelease.update({"_id": rp._id}, updata, function (err, data) {
        if (err) {
          res.flush("error", err.errors);
        } else {
          req.flash('success', "发布已取消");
        }
        res.redirect('/shop/product/link/release/list');
      });
    }
  });
};
/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.findDatatable = function (req, res) {
  var id = req.params.id || req.query.id;//商品分类
  var category = req.query.category;//商品分类
  var name = req.query.name;//商品名称
  var evaScore = req.query.evaScore;//描述相符
  var activityType = req.query.activityType;//活动类型
  var querys = {};
  if (name != "" && name != undefined) {
    querys.name = {$regex: name};
  }
  if (category != "" && category != undefined) {
    querys.category = category;
  }
  if (evaScore != "" && evaScore != undefined) {
    if (evaScore == '4.0') {
      querys.evaScore = {$lt: evaScore};
    } else {
      querys.evaScore = evaScore;
    }
  }
  if (activityType != "" && activityType != undefined) {
    querys.activityType = activityType;
  }
  LinkProductRelease.findOne({"_id": id}, function (err, rp) {
    if (!err) {
      querys._id = {$in: rp.products};
      LinkProduct.dataTable(req.query, {conditions: querys}, function (err, data) {
        res.send(data);
      });
    }
  });
};
/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.findTopDatatable = function (req, res) {
  var id = req.params.id || req.query.id;//
  LinkProductRelease.findOne({"_id": id}, function (err, rp) {
    if (!err) {
      LinkProduct.dataTable(req.query, {conditions: {'_id': {'$in': rp.onTopProducts}}}, function (err, data) {
        res.send(data);
      });
    }
  });
};
/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.Rdatatable = function (req, res) {
  var title = req.query.title;//商品分类
  var time = req.query.time;//筛选时间
  var querys = {};
  if (title != "" && title != undefined) {
    querys.title = {$regex: title};
  }
  if (time != "" && time != undefined) {
    var s = new Date(moment(time).format("YYYY/MM/DD 00:00:00"));
    var e = new Date(moment(time).format("YYYY/MM/DD 23:59:59"));
    querys.createdAt = {$gte: s, $lt: e};
  }
  querys.channel = req.session.channelId;

  LinkProductRelease.dataTable(req.query, {conditions: querys}, function (err, data) {
    console.log(data);
    res.send(data);
  });
};
/**
 * 用于产品筛选获取最终结果集
 * @param req
 * @param res
 */
exports.linkdatatable = function (req, res) {
  var category = req.query.category;//商品分类
  var activityType = req.query.activityType;//活动分类
  var startDate = req.query.startDate;//活动开始
  var endDate = req.query.endDate;//活动结束
  var name = req.query.name;//产品名称
  var evaScore = req.query.evaScore;//描述相符
  var endBegin = req.query.endBegin;//筛选时间
  var endEnd = req.query.endEnd;//月销量
  //排序筛选条件
  var activityPrice = req.query.activityPrice;//活动价:
  var stockNum = req.query.stockNum;//库存量
  var diffPrice = req.query.diffPrice;//描述相符
  var init = req.query.init;//描述相符
  var querys = {};
  if (category != "" && category != undefined) {
    querys.category = {$regex: category};
  }
  if (activityType != "" && activityType != undefined) {
    querys.activityType = {$regex: activityType};
    if(activityType == 'c'){
      querys.channel = req.session.channelId;
    }
  }
  if (startDate != "" && startDate != undefined) {
    var start = new Date(moment(startDate).format("YYYY/MM/DD 00:00:00"));//{$gte: sdate, $lt: edate}
    querys.startDate = {$gte: start};
  }
  if (name != "" && name != undefined) {
    querys.name = {$regex: name};
  }
  if (evaScore != "" && evaScore != undefined) {
    if (evaScore == '4.0') {
      querys.evaScore = {$lt: evaScore};
    } else {
      querys.evaScore = evaScore;
    }
  }
  if (endDate != "" && endDate != undefined) {
    var end = new Date(moment(endDate).format("YYYY/MM/DD 00:00:00"));
    querys.endDate = {$lt: end};
  }
  if (init == '1') {
    var sds = new Date(moment());//{$gte: sdate, $lt: edate}
    querys.startDate = {$lt: sds};
    querys.endDate = {$gte: sds};
  }
  // desc
  var orders = req.query.order;
  var order = {};
  if (activityPrice != "" && activityPrice != undefined) {
    order = {column: '8', dir: activityPrice}
    orders.push(order);
  }
  if (diffPrice != "" && diffPrice != undefined) {
    order = {column: '9', dir: diffPrice}
    orders.push(order);
  }
  console.log("querys===============",querys);
  req.query.order = orders;
  LinkProduct.dataTable(req.query, {conditions: querys}, function (err, data) {
    res.send(data);
  });
};
/**
 *  发布产品，并生成发布信息
 * @param req
 * @param res
 */
exports.releaseProduct = function (req, res) {
  var release = {};
  release.title = req.query.title || req.body.title;
  release.channel = req.session.channelId;
  var productIds = req.query.productIds || req.body.productIds;
  var rp = new LinkProductRelease(release);
  rp.save(function (err, rp) {
    if (err) {
      res.flush("error", err.errors);
      res.redirect('/shop/product/list');
    } else {
      var productId = productIds.split(",");
      LinkProductRelease.addProducts(rp._id, productId, function (err, rp) {
        if (!err) {
          res.redirect('/shop/product/link/release/list');
        } else {
          res.redirect('/shop/product/link/list');
        }
      });
    }
  });
};
/**
 *  添加产品到已有的发布信息当中去
 * @param req
 * @param res
 */
exports.addProduct = function (req, res) {
  var id = req.query.releaseProduct || req.body.releaseProduct;
  var productIds = req.query.productIds || req.body.productIds;
  var productId = productIds.split(",");
  LinkProductRelease.addProducts(id, productId, function (err, rp) {
    if (!err) {
      req.flash('success', "产品添加成功");
      res.redirect('/shop/product/link/list');
    } else {
      req.flash('error', "产品添加失败");
      res.redirect('/shop/product/link/list');
    }
  });
};
/**
 * 将产品移除结果集
 * @param req
 * @param res
 */
exports.remeveProduct = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  var productIds = req.body.productIds || req.params.productIds;
  console.log("Revoke permissions with RoleID: " + ids + ", PermissionIds: " + productIds);
  if (!ids) {
    res.send({});
  } else {
    var pids = productIds.split(",");
    LinkProductRelease.revokeProducts(ids, pids, function (err, role) {
      if (err) {
        res.flush("error", err.errors);
      } else {
        req.flash('success', "产品移除成功");
      }
      res.redirect('/shop/product/link/findProduct/' + ids);
    });
  }
};
/**
 *  添加产品到已有的发布信息当中去
 * @param req
 * @param res
 */
exports.addTopProducts = function (req, res) {
  var id = req.query.releaseProductId || req.body.releaseProductId;
  var productIds = req.query.productId || req.body.productId;
  var productId = productIds.split(",");
  LinkProductRelease.addTopProducts(id, productId, function (err, rp) {
    if (err.code == "0") {
      req.flash('error', "置顶产品最多5条，最多还能设置" + (5 - err.len) + "条置顶产品");
    } else {
      req.flash('success', "产品置顶成功" + err.len + "条");
    }
    res.redirect('/shop/product/link/findProduct/' + id);
  });
};
/**
 * 将产品移除结果集
 * @param req
 * @param res
 */
exports.revokeTopProducts = function (req, res) {
  var ids = req.body.rpIds || req.params.rpIds;
  var productIds = req.body.rProductId || req.params.rProductId;
  console.log("Revoke permissions with RoleID: " + ids + ", PermissionIds: " + productIds);
  if (!ids) {
    res.send({});
  } else {
    var pids = productIds.split(",");
    LinkProductRelease.revokeTopProducts(ids, pids, function (err, role) {
      if (err) {
        res.flush("error", err.errors);
      } else {
        req.flash('success', "产品置顶已取消");
      }
      res.redirect('/shop/product/link/findProduct/' + ids);
    });
  }
};
/**
 *  删除结果集
 * @param req
 * @param res
 */
exports.delRelease = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  LinkProductRelease.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', "删除成功");
      res.redirect('/shop/product/link/release/list');
    }
  });
};
/**
 *  设置发布位置
 * @param req
 * @param res
 */
exports.setPosition = function (req, res) {
  var ids = req.body.releaseIds || req.params.releaseIds;
  LinkProductRelease.findOne({'_id': ids}, function (err, rp) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      var updata = {};
      updata.published = true;
      LinkProductRelease.update({'_id': rp._id}, updata, function (err, info) {
        if (!err) {
          req.flash('success', "发布成功");
          res.redirect('/shop/product/link/release/list');
        }
      });
    }
  });
};
/**
 * 检查角色名称是否已经存在^
 */
exports.checkTitle = function (req, res) {
  var title = req.query.title || req.body.title;
  var channelId = req.session.channelId;
  LinkProductRelease.count({'channel': channelId, 'title': title}, function (err, result) {
    if (result > 0) {
      res.send('false');
    } else {
      res.send('true');
    }
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
    LinkProduct.count({'no': no, channel: req.session.channelId}, function (err, result) {
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
exports.checkName = function (req, res) {
  var name = req.query.name;
  var oldName = req.query.oldName;
  if (name === oldName) {
    res.send('true');
  } else {
    LinkProduct.count({'name': name, channel: req.session.channelId}, function (err, result) {
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
exports.getAllRelease = function (req, res) {
  var channelId = req.session.channelId;
  LinkProductRelease.find({'channel': channelId}, function (err, result) {
    if (!err) {
      res.send(result)
    }
  });
};

/**
 * 页面设置
 */
exports.site = function (req, res) {
  res.render('shop/product/page/list');
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
 * 发布页面
 */
exports.siteRelease = function (req, res) {
  var id = req.params.id || req.query.id;
  var v = req.query.v;

  var updata = {};
  updata.online = v > 0 ? true : false;
  LinkProductSite.update({"_id": id}, updata, function (err, data) {
    if (err) {
      req.flash("error", err.errors);
    } else {
      req.flash('success', v > 0 ? "发布成功" : "发布已取消");
    }
    res.redirect('/shop/product/link/site');
  });
};
