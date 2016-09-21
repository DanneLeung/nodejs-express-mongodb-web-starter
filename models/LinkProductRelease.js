/**
 * Created by xingjie201 on 2016/3/21.
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var _ = require("lodash");

/**
 * 角色
 * @type {Schema}
 * @param {name:发布名称}
 * @param {products:内联文档}
 */
var LinkProductReleaseSchema = mongoose.Schema({
  channel: {type: ObjectId, ref: 'Channel'}, //渠道
  title: {type: String, required: true, default: ''}, //产品结果集的名称
  description: {type: String, default: ''}, //描述
  products: [{type: ObjectId, ref: 'LinkProduct'}], //结果集所有的产品
  onTopProducts: [{type: ObjectId, ref: 'LinkProduct'}], //置顶商品
  //page: [{type: String, ref: 'Page'}], //发布的页面
  //position: {type: String, default: ''}, //发布位置
  published: {type: Boolean, default: false}//发布
}, {timestamps: {}});

LinkProductReleaseSchema.statics = {
  products: function (id, done) {
    LinkProductRelease.findById(id, function (err, role) {
      role.populate('products', function (err, r) {
        done(r.permissions);
      });
    });
  },
  addProducts: function (id, productIds, done) {
    LinkProductRelease.findById(id, function (err, rp) {
      //先合并产品id在排序
      rp.products = _.uniq(_.union(rp.products, productIds), function (p) {
        //字符串比较
        return p + "";
      });
      rp.save(function (err, rp) {
        done(err, rp);
      });
    });
  },
  revokeProducts: function (id, productIds, done) {
    LinkProductRelease.findById(id, function (err, rp) {
      console.log("final productIds:\n" + productIds);
      // 去除选择解除权限的权限ID
      rp.products = _.remove(rp.products, function (n) {
        var idx = productIds.some(function (p) {
          //字符串比较
          return p == n + "";
        });
        return !(productIds == n + "" || idx);
      });
      rp.save(function (err, rp) {
        done(err, rp);
      });
    });
  },
  addTopProducts: function (id, productIds, done) {
    LinkProductRelease.findById(id, function (err, rp) {
      if ((rp.onTopProducts.length + productIds.length) > 5) {
        err = {"code": "0", "len": rp.onTopProducts.length};
        done(err, rp)
      } else {
        //先合并产品id在排序
        rp.onTopProducts = _.uniq(_.union(rp.onTopProducts, productIds), function (p) {
          //字符串比较
          return p + "";
        });
        rp.save(function (err, rp) {
          err = {"code": "1", "len": rp.onTopProducts.length};
          done(err, rp);
        });
      }
    });
  },
  revokeTopProducts: function (id, productIds, done) {
    LinkProductRelease.findById(id, function (err, rp) {
      console.log("final productIds:\n" + productIds);
      // 去除选择解除权限的权限ID
      rp.onTopProducts = _.remove(rp.onTopProducts, function (n) {
        var idx = productIds.some(function (p) {
          //字符串比较
          return p == n + "";
        });
        return !(productIds == n + "" || idx);
      });
      rp.save(function (err, rp) {
        done(err, rp);
      });
    });
  }
}
var LinkProductRelease = mongoose.model('LinkProductRelease', LinkProductReleaseSchema, 'linkproductrelease');
module.exports = LinkProductRelease;
