/**
 * 站点
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var SiteSchema = mongoose.Schema({
  _id: { type: String, default: ShortId.generate },
  wechat: { type: ObjectId, ref: "Wechat" }, //使用的微信号
  template: { type: String, ref: "Template" },
  name: { type: String, required: true, default: '' }, //名称
  title: { type: String, required: true, default: '' }, //标题
  favicon: { type: String, required: false, default: '' }, //站点icon
  logo: { type: String, required: false, default: '' }, //站点logo
  domain: { type: String, required: false, default: '' },//绑定域名
  url: { type: String, required: false, default: '' }, //平台入口真实url
  qrcode: { type: String, required: false, default: '' }, //平台入口真实url
  script: { type: String, required: false, default: '' }, //底部统计代码等
  metas: [{ name: { type: String }, content: { type: String } }], //meta元素
  seoKeywords: { type: String, required: false, default: '' },//站点seo关键字
  keyword: { type: String, required: false, default: '' },//触发关键字
  description: { type: String, default: '' }, //描述
  copyright: { type: String, default: '' }, //版权声明
  slide: { type: String, ref: 'Slide' },//轮播广告
  navigation: [{
    title: { type: String, default: '' },//标题
    link: { type: String, default: '' },//链接
    image: { type: String, default: '' },//图片
    iconClass: { type: String, default: '' }//图标class
  }], //导航
  // pages: [{ type: ObjectId, ref: "Page" }], //子页面
  publishedAt: { type: Date },
  enabled: { type: Boolean, default: false } //激活
}, { timestamps: {} });

SiteSchema.pre('save', function (done) {
  var that = this;
  Site.findOne({ name: that.name }, function (err, site) {
    if (err) {
      done(err);
    } else if (site && !(site._id.equals(that._id))) {
      that.invalidate('name', '站点名称必须唯一');
      done(new Error('站点名称必须唯一'));
    } else {
      done();
    }
  });
});
var Site = mongoose.model('Site', SiteSchema, 'sites');
module.exports = Site;
