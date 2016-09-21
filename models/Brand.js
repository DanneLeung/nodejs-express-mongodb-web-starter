/**
 * 线下品牌及报名
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var BrandSchema = mongoose.Schema({
  _id: { type: String, default: ShortId.generate },
  channel: {type: ObjectId, ref: "Channel"}, //渠道
  nameCh: { type: String, default: '' },//中文名称
  nameEn: { type: String, default: '' },//英文名称
  logo: {type: ObjectId, required: false, ref: "File"},//logo图片
  url: { type: String, default: '' },//主页url
  description: { type: String, default: '' },//描述
  enabled: { type: Boolean, default: true } //激活
}, { timestamps: {} });

BrandSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Brand').findOne({ nameCh: that.name, channel: that.channel }, function (err, site) {
    if (err) {
      done(err);
    } else if (site && !(site._id.equals(that._id))) {
      that.invalidate('nameCh', '品牌名称必须唯一');
      done(new Error('品牌名称必须唯一'));
    } else {
      done();
    }
  });
});

module.exports = mongoose.model('Brand', BrandSchema, 'brands');
