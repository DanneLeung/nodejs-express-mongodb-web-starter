/**
 * 微信推广
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var shortId = require("shortid");

var WechatBrandingSchema = new Schema({
  channel: { type: ObjectId, ref: 'Channel' }, //渠道
  wechat: { type: ObjectId, ref: 'Wechat' }, //渠道下的公众号
  member: { type: ObjectId, ref: 'Memeber' }, //关联会员
  branch: { type: ObjectId, ref: 'Branch' }, //关联网点
  openid: { type: String }, //openid
  unionid: { type: String }, //unionid
  fans: {
    nickname: { type: String }, //粉丝昵称
    headimgurl: { type: String } //粉丝头像url
  },
  user: {
    fullname: { type: String, trim: true }, //姓名
    mobile: { type: String, trim: true }, //手机
    idcard: { type: String, trim: true }, //身份证
    email: { type: String, trim: true }, //Email
    employeeNo: { type: String, trim: true } //员工号
  },
  applyTime: { type: Date }, //申请时间
  qrcode: { type: String }, //二维码URL
  type: { type: String }, //二维码类型 1:临时 2:永久
  url: { type: String }, //分享页面URL
  ticket: [{ type: String }], //二维码ticket
  expiresTime: { type: Date }, //二维码超时时间
  scanTimes: { type: Number, default: 0 }, //二维码扫描次数
  gainFans: { type: Number, default: 0 }, //获得粉丝
  approved: { type: Boolean, default: false }, //已授权？
  enabled: { type: Boolean, default: true }, //可用
  identifyNo: { type: String, default: shortId.generate }, //标识码
  flag: { type: String, default: "1" } // 员工白名单:1 网点机构:2
}, { timestamps: {} });

WechatBrandingSchema.methods = {}
mongoose.model('WechatBranding', WechatBrandingSchema, 'wechatbrandings')