/**
 * 贷款功能设置数据模型
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var LoanSettingSchema = mongoose.Schema({
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  shareLogo:{type: String, default: '' }, //分享图片
  shareTitle:{type: String, default: '' }, //分享标题
  shareText:{type: String, default: '' }, //分享内容
  needRegister: {type: Boolean, default: false}, //是否需关注才能打开
  site: {
    title: { type: String, default: '' },//站点标题
    slide: { type: String, ref: 'Slide' }, //首页轮播图片
    footer: { type: String, default: '' },//站点footer文字
    tip: {type: String, default: ''}, //提示
    pv: {type: Number, default: 0}
  },//站点设置
  page: {

  },//页面设置
  fields: {
    gender: {type: Boolean, required: true, default: false}, //性别
    recommend: {type: Boolean, required: true, default: false}, //推荐人
    email: {type: Boolean, required: true, default: false} //邮箱

  }//预定义字段
}, { timestamps: {} });

var LoanSetting = mongoose.model('LoanSetting', LoanSettingSchema, 'loansettings');
module.exports = LoanSetting;
