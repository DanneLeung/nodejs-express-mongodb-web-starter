/**
 * 页面
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var _ = require("lodash");

var PageSchema = mongoose.Schema({
  _id: { type: String, default: ShortId.generate },
  wechat: [{ type: ObjectId, ref: "Wechat" }], //使用的微信号
  site: { type: String, ref: "Site" }, //所属站点
  name: { type: String, required: true, default: '' }, //名称
  title: { type: String, required: false, default: '' }, //标题
  url: { type: String, required: true, default: '' }, //url
  qrcode: { type: String, required: false, default: '' }, //url的二维码
  description: { type: String, default: '' },
}, { timestamps: {} });

PageSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Page').findOne({ name: that.name }, function (err, Page) {
    if(err) {
      done(err);
    } else if(Page && !(Page._id.equals(that._id))) {
      that.invalidate('name', '页面名称必须唯一');
      done(new Error('页面名称必须唯一'));
    } else {
      done();
    }
  });
});

module.exports = mongoose.model('Page', PageSchema, 'pages');