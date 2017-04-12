/**
 * Created by ZhangXiao on 2016/3/10.
 * 渠道微信公众号配置
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var WechatSchema = mongoose.Schema({
  type: { type: String, required: false, default: "" }, // 公众号类型 1:普通订阅号 2:微信认证订阅号 3:普通公众号 4:微信认证公众号
  name: { type: String, required: true, default: "" }, // 公众号名称
  originalId: { type: String, required: false, index: true, default: "" }, // 原始ID
  wechatNo: { type: String, required: false, default: "" }, //微信号
  appid: { type: String, required: false, default: "" }, //应用ID
  appsecret: { type: String, required: false, default: "" }, //应用密钥
  token: { type: String, required: false, default: "" }, //token
  encodingAESKey: { type: String, required: false, default: "" }, //消息加解密密钥
  url: { type: String, required: false, default: "" }, //接口url
  logo: { type: ObjectId, required: false, ref: "File" }, //logo图片路径
  qrcode: { type: ObjectId, required: false, ref: "File" }, //QRCode二维码图片
  oauthWechat: { type: ObjectId, required: false, ref: "Wechat" }, //Oauth2认证借用的微信公众号，比如订阅号借用服务号认证
  default: { type: Boolean, default: false }, //默认公众号
  checked: { type: Boolean, default: false } //是否经过验证
}, { timestamps: {} });

/**
 * 查找渠道中配置的默认公众号
 * @param channelId 渠道id
 * @param done 回调
 */
WechatSchema.statics.getDefault = function (done) {
  Wechat.findOne({ default: true }).exec(function (err, o) {
    if(err) console.error(err);
    if(!o) {
      Wechat.findOne({}).exec(function (err, w) {
        if(err) console.error(err);
        return done(err, w);
      });
    }
    return done(err, o);
  });
};
/**
 * 根据appid查找wechat
 * @param appid
 * @param done
 */
WechatSchema.statics.findByAppid = function (appid, done) {
  Wechat.findOne({ appid: appid }).exec(function (err, o) {
    if(err) console.error(err);
    return done(err, o);
  });
};

/**
 * 根据渠道id，wechatid取得可以执行页面认证授权的微信公众号，借用则取借用的公众号
 **/
WechatSchema.statics.getWechat = function (done) {
  Wechat.findOne({}).populate('oauthWechat log').exec(function (err, wechat) {
    if(err) console.error(err);

    if(!wechat)
      console.log("************************ 没有可用的公众号", wechatId);
    return done(err, wechat);
  });
};

/**
 * 获取用已用于被借用oauth的服务号
 */
WechatSchema.statics.getAuthWechat = function (done) {
  Wechat.find({ type: { $in: ['3', '4'] } }).exec(function (err, wechats) {
    if(err) console.error(err);
    done(err, wechats);
  });
};

var Wechat = mongoose.model('Wechat', WechatSchema, 'wechats');
module.exports = Wechat;