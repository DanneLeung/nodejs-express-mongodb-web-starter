/**
 * 轮播幻灯片
 */
"use strict";
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var ShortId = require('shortid');

var SlideSchema = mongoose.Schema({
  _id: { type: String, default: ShortId.generate },
  type: { type: String, default: '' }, //类型
  name: { type: String, required: true, index: true, default: '' }, //名称
  images: [{
    title: { type: String, default: '' }, //图片标题
    url: { type: String, default: '' }, //图片远程url，引用外部图片时直接完整URL
    link: { type: String, default: '' }, //图片点击链接
    sort: { type: Number, default: 0 } //排序，也可以按照数组顺序
  }],
  description: { type: String, default: '' }, //描述
  enabled: { type: Boolean, default: true } //是否发布
}, { timestamps: {} });

SlideSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Slide').findOne({ name: that.name }, function (err, Slide) {
    if(err) {
      done(err);
    } else if(Slide && !(Slide._id.equals(that._id))) {
      that.invalidate('name', '幻灯片名称必须唯一');
      done(new Error('幻灯片名称必须唯一'));
    } else {
      done();
    }
  });
});

/**
 * 激活中可用的轮播幻灯片列表
 */
SlideSchema.statics.enabledList = function (callback) {
  Slide.find({ enabled: true }).exec(function (err, slides) {
    if(err) {
      console.err(err);
    }
    callback(err, slides);
  });
};

var Slide = mongoose.model('Slide', SlideSchema, 'slides');
module.exports = Slide;