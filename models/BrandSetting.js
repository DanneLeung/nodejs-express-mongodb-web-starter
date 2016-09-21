/**
 * Created by danne on 2016/3/30.
 * 微信回复信息配置
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 * 推广二维码认证申请设置
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var BrandSettingSchema = new Schema({
  auth: {type: Boolean, required: true, default: true}   // 是否需要认证
  , mobile: {type: Boolean, required: true, default: true}   // 是否需要手机号
  , fullname: {type: Boolean, required: true, default: true}   // 是否需要全名
  , idcard: {type: Boolean, required: true, default: true}   // 是否需要身份证
  , email: {type: Boolean, required: true, default: true}   // 是否需要email
  , employeeNo: {type: Boolean, required: true, default: true}   // 是否需要员工号
  , type: {type: String, required: true, default: "1"}   // 1:临时 2:永久
  , expireSeconds: {type: String}   // 过期时间(单位:秒)
  , sceneStr: {type: String}   // 场景值
  , appid: {type: String} //所属公众号
  , logo: {type: ObjectId, ref:"File"} //分享使用的logo
  , title: {type: String} //分享标题
  , desc: {type: String} //分享描述
  , html: {type: String} //分享内容页面(html代码)
}, {timestamps: {}});
//db.branches.ensureIndex({"coordinate":"2d"},{"background":"true"})

BrandSettingSchema.methods = {};

var BrandSettingSchema = mongoose.model('BrandSetting', BrandSettingSchema, 'brandSettings');
