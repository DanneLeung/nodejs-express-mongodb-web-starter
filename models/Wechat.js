/**
 * Created by ZhangXiao on 2016/3/10.
 * 渠道微信公众号配置
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ChannelWechatSchema = mongoose.Schema({
  channel: { type: ObjectId, required: true, ref: "Channel" },//渠道
  type: { type: String, required: false, default: "" }, // 公众号类型 1:普通订阅号 2:微信认证订阅号 3:普通公众号 4:微信认证公众号
  name: { type: String, required: true, default: "" }, // 公众号名称
  originalId: { type: String, required: false, index: true, default: "" },   // 原始ID
  wechatNo: { type: String, required: false, default: "" },    //微信号
  appid: { type: String, required: false, default: "" },    //应用ID
  appsecret: { type: String, required: false, default: "" },    //应用密钥
  token: { type: String, required: false, default: "" },    //token
  encodingAESKey: { type: String, required: false, default: "" },    //消息加解密密钥
  url: { type: String, required: false, default: "" },    //接口url
  logo: { type: ObjectId, required: false, ref: "File" },    //logo图片路径
  qrcode: { type: ObjectId, required: false, ref: "File" },    //QRCode二维码图片
  oauthWechat: { type: ObjectId, required: false, ref: "ChannelWechat" },    //Oauth2认证借用的微信公众号，比如订阅号借用服务号认证
  default: { type: Boolean, default: false },  //默认公众号
  checked: { type: Boolean, default: false }  //是否经过验证
}, { timestamps: {} });

/**
 * 根据appid查找wechat
 * @param appid
 * @param done
 */
ChannelWechatSchema.statics.findByAppid = function (appid, done) {
  ChannelWechat.findOne({ appid: appid }).exec(function (err, o) {
    if (err) console.error(err);
    return done(err, o);
  });
}

/**
 * 根据渠道id，wechatid取得可以执行页面认证授权的微信公众号，借用则取借用的公众号
 **/
ChannelWechatSchema.statics.getWechat = function (channelId, wechatId, done) {
  //if (!wechatId) {
  //  wechatId = null;
  //}
  ChannelWechat.findOne({ _id: wechatId, channel: channelId }).populate('channel oauthWechat logo').exec(function (err, wechat) {
    if (err) {
      console.error(err);
      return done(err, null);
    }
    // 如果公众号是服务号
    if (wechat && (wechat.type === '4' || wechat.type === '3')) {
      return done(null, wechat);
    }

    // 如果公众号配置了借用授权服务号
    if (wechat && wechat.oauthWechat) {
      console.log("************************ getWechat 找到借用公众号", wechat.oauthWechat);
      return done(null, wechat);
    }

    //先查找默认的公众号，否则取第一个公众号
    var or = [];
    //if (wechatId) {
    //  or.push({'_id': wechatId, 'type': {$in: ['4', '3']}});//先wechatid查找认证服务号
    //}
    // 未指定公众号id，查找渠道公众号
    if (channelId) {
      or.push({ "channel": channelId, 'type': { $in: ['4', '3'] }, default: true });//查找渠道默认认证服务号
      or.push({ "channel": channelId, 'type': { $in: ['4', '3'] } });//查找渠道认证服务号
    }

    // 没有正确传入查询条件
    if (!or.length) {
      console.warn("*************************** 试图读取wechat数据，但没有传入正确条件!");
      return done(null, wechat);
    }
    console.info("*************************** 读取wechat的条件 ", or);
    ChannelWechat.findOne({
      $or: or
    }).populate('channel oauthWechat log').exec(function (err, o) {
      if (err) console.error(err);

      if (wechat && o) {
        wechat.oauthWechat = o;
      } else if (o) {
        //渠道有可用服务号
        wechat = o;
      } else {
        console.warn('********************* 公众号%s没有找到授权借用服务号!', wechatId);
      }
      if (!wechat)
        console.log("************************ 没有可用的公众号", channelId, wechatId);
      return done(err, wechat);
    });

    //var or = [{ channel: ObjectId('56e2716cbc846d2f494a9f87'), type: {$in: ['4', '3']}, default: true}, {channel: ObjectId('56e2716cbc846d2f494a9f87'), type: {$in: ['4', '3']}}];

  });
};

/**
 * 获取用已用于被借用oauth的服务号
 */
ChannelWechatSchema.statics.getAuthWechat = function (channelId, done) {
  ChannelWechat.find({ type: { $in: ['3', '4'] } }).exec(function (err, wechats) {
    if (err) console.error(err);
    done(err, wechats);
  });
}

var ChannelWechat = mongoose.model('ChannelWechat', ChannelWechatSchema, 'channelwechats');
module.exports = ChannelWechat;
